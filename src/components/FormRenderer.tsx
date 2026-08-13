import React, { useState, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { computeAnchoredPosition, AnchoredPosition } from '../utils/anchoredPosition';
import { computeDerivedFields } from '../utils/computedFields';
import { isEmptyFieldValue } from '../utils/formValues';
import { getBenefitCredit } from '../utils/benefitCredit';
import { localDateFromString } from '../utils/dateLocal';
import { FormField, ProcessDefinition } from '../types';
import { Button } from './ui/Button';
import { READONLY_INPUT, READONLY_SURFACE, READONLY_TEXT } from './ui/ReadOnlyField';
import { 
  FileText, Plus, Trash2, Calendar, DollarSign, Percent, 
  User, Hash, Search, List, ChevronDown, Check,
  X, Edit2, CheckCircle2, Calculator, Table, Signature,
  History, Info, Lock, Unlock, Zap, Copy, Layers,
  CheckSquare, ToggleLeft, ToggleRight, Radio, Mail, Phone,
  MapPin, Briefcase, Award, GraduationCap, Building2, CreditCard
} from 'lucide-react';
import { EmployeeZoom } from './zooms/EmployeeZoom';
import { CandidateZoom } from './zooms/CandidateZoom';
import { ApprovedCandidateZoom } from './zooms/ApprovedCandidateZoom';
import { ApprovedVacancyZoom } from './zooms/ApprovedVacancyZoom';
import { RecentlyHiredEmployeeZoom } from './zooms/RecentlyHiredEmployeeZoom';
import { DependentZoom } from './zooms/DependentZoom';
import { ManagerZoom } from './zooms/ManagerZoom';
import { useAppConfig } from '../contexts/AppConfigContext';

interface FormRendererProps {
  definition: ProcessDefinition;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
  onCancel: () => void;
  onDataChange?: (data: Record<string, any>) => void;
  onValidityChange?: (isValid: boolean) => void;
  readOnly?: boolean;
  hideActions?: boolean;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEK_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const CALENDAR_WIDTH = 320;
const CALENDAR_FALLBACK_HEIGHT = 360; // usado só antes da 1ª medição real
const VIEWPORT_MARGIN = 8; // margem mínima até a borda da viewport

type CalendarPosition = AnchoredPosition;

// Reaproveita o utilitário compartilhado de posicionamento por portal, fixando
// a largura do calendário em 320px.
const computeCalendarPosition = (anchor: HTMLElement, height: number): CalendarPosition =>
  computeAnchoredPosition(anchor, height, { width: CALENDAR_WIDTH, gap: 8, margin: VIEWPORT_MARGIN });

const localDateToDisplay = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const formatDateForDisplay = (value: any) => {
  if (!value) return '';
  const str = String(value).trim();
  const date = localDateFromString(str);
  if (date) return localDateToDisplay(date);
  return str;
};

/**
 * Mensagem de "não preenchido". Só o envio a grava; a validação ao vivo a
 * preserva em vez de apagá-la junto com os erros de negócio já corrigidos.
 */
const CAMPO_OBRIGATORIO = 'Campo obrigatório';

const maskDateValue = (value: string) => {
  const digits = value.replace(/[^\d]/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
};

export function FormRenderer({ 
  definition, 
  initialData = {}, 
  onSubmit, 
  onCancel,
  onDataChange,
  onValidityChange,
  readOnly = false,
  hideActions = false
}: FormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [openCalendarField, setOpenCalendarField] = useState<string | null>(null);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [calendarPos, setCalendarPos] = useState<CalendarPosition | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dateAnchorRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const firstErrorRef = useRef<HTMLDivElement>(null);
  const { config } = useAppConfig();

  // Handle CURRENT_USER pre-filling
  useEffect(() => {
    if (definition.targetMode === 'CURRENT_USER' && config.usuarioAtual.employeeId) {
      const emp = config.colaboradores.find(e => e.id === config.usuarioAtual.employeeId);
      if (emp) {
        const updates: Record<string, any> = {
          colaborador: emp.name,
          employeeId: emp.id,
          matricula: emp.registration,
          cargo: emp.role,
          setor: emp.department,
          filial: emp.branch,
          empresa: emp.company,
          admissao: emp.admissionDate,
          periodoaquisitivo: '2024/2025',
          saldo: 30,
          // Histórico de dias já usufruídos no período aquisitivo (NÃO a
          // solicitação atual). Alimenta o campo CALC "Dias Já Gozados".
          diasGozadosHist: emp.vacationRecords?.[0]?.daysTaken ?? 0
        };
        // Only update if current form data is empty for these keys to avoid overriding user changes
        setFormData(prev => {
          const next = { ...prev };
          let changed = false;
          Object.entries(updates).forEach(([k, v]) => {
            if (!next[k]) {
              next[k] = v;
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      }
    }
  }, [definition.targetMode, config.usuarioAtual, config.colaboradores]);

  // Recebimento de VR/VA: o crédito é lançado pelo RH. Os campos do benefício
  // (origin 'F') chegam preenchidos e o colaborador apenas confere e assina —
  // independe do vínculo com um cadastro de colaborador.
  useEffect(() => {
    if (definition.processId !== '5') return;
    const credit = getBenefitCredit(config.beneficios);
    setFormData(prev => {
      const next = { ...prev };
      let changed = false;
      Object.entries(credit).forEach(([key, val]) => {
        if (next[key] === undefined || next[key] === null || next[key] === '') {
          next[key] = val;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [definition.processId, config.beneficios]);

  // ECO DO PRÓPRIO ESTADO ≠ DADO EXTERNO
  //
  // `onDataChange` entrega ao pai o objeto de `formData`. O pai costuma guardá-lo
  // e devolvê-lo como `initialData` — era o que o RHRequestForm fazia. Só que o
  // eco chega ATRASADO: entre a emissão e a volta, o usuário já digitou a tecla
  // seguinte. Reaplicar esse eco sobrepunha a cópia velha sobre o valor novo.
  //
  // O efeito não perdia "a última tecla": os dois estados passavam a se
  // perseguir. Digitando "40" o formulário oscilava 4 → 40 → 4 → 40 até o React
  // abortar com "Maximum update depth exceeded", parando no 4. O mesmo ocorria
  // com a data (a última posição não fixava) e com o select (o clique do mouse
  // gera UMA mudança, e era ela que o eco desfazia — pelo teclado as mudanças
  // intermediárias davam a impressão de funcionar).
  //
  // Guardar o que foi emitido resolve na raiz e protege qualquer chamador: o que
  // saiu daqui não volta como dado de fora. O WeakSet não segura memória — o
  // snapshot é coletado junto com o objeto.
  const snapshotsEmitidos = useRef<WeakSet<object>>(new WeakSet());

  // Sync with initialData if it changes
  useEffect(() => {
    if (initialData && snapshotsEmitidos.current.has(initialData)) return;
    setFormData(prev => {
      // Only update if it's actually different to avoid infinite loops with onDataChange
      const next = { ...prev, ...initialData };
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        return next;
      }
      return prev;
    });
  }, [initialData]);

  // Clear fields that are no longer visible
  useEffect(() => {
    const currentStep = definition.steps[0];
    if (!currentStep) return;
    
    const fields = currentStep.fields;
    let hasChanged = false;
    const newData = { ...formData };
    const invisibleFieldIds: string[] = [];

    fields.forEach(field => {
      const fieldId = (field as any).id || field.name;
      const isVisible = !field.condition || field.condition(newData);
      
      if (!isVisible) {
        invisibleFieldIds.push(fieldId);
        if (newData[fieldId] !== undefined && newData[fieldId] !== '' && newData[fieldId] !== null) {
          // Only delete if NO fields with this fieldId are visible
          const isAnyFieldVisible = fields.some(f => {
            const fId = (f as any).id || f.name;
            return fId === fieldId && (!f.condition || f.condition(newData));
          });
          
          if (!isAnyFieldVisible) {
            delete newData[fieldId];
            hasChanged = true;
          }
        }
      }
    });

    if (hasChanged) {
      setFormData(newData);
    }

    // Also clear errors for invisible fields
    if (invisibleFieldIds.length > 0) {
      setErrors(prev => {
        const next = { ...prev };
        let errorsChanged = false;
        invisibleFieldIds.forEach(id => {
          if (next[id]) {
            delete next[id];
            errorsChanged = true;
          }
        });
        return errorsChanged ? next : prev;
      });
    }
    // Reage a qualquer mudança em formData, não só a `tipoRequisicao`: qualquer
    // campo pode ser o controlador de uma `condition` (ex.: `operacao` no
    // processo 6). Converge porque a remoção é idempotente — a passagem seguinte
    // não encontra mais nada a apagar e `hasChanged` fica false.
  }, [formData, definition.steps]);

  // Notify parent of changes and validity
  useEffect(() => {
    if (onDataChange) {
      // Marca ANTES de emitir: quando este mesmo objeto voltar como
      // `initialData`, o efeito de sync sabe que é eco e não dado externo.
      snapshotsEmitidos.current.add(formData);
      onDataChange(formData);
    }

    const currentStep = definition.steps[0];
    if (!currentStep) return;
    const fields = currentStep.fields;
    let isValid = true;

    // Erro de NEGÓCIO (saldo de férias excedido, por exemplo) aparece AO VIVO no
    // campo. Antes ele só bloqueava: o botão "Confirmar e Enviar" apagava e nada
    // explicava por quê. A mensagem vinha de `validate()`, que roda no submit
    // interno do FormRenderer — e quem usa `hideActions` com botão próprio (o
    // RHRequestForm) nunca chega lá.
    //
    // "Campo obrigatório" continua de fora: quem não foi preenchido AINDA não é
    // erro, e um formulário recém-aberto não deve nascer vermelho. Esse continua
    // saindo no envio, junto com o scroll até o primeiro campo.
    const errosDeNegocio: Record<string, string> = {};

    fields.forEach(field => {
      if (field.condition && !field.condition(formData)) return;

      const fieldId = field.id || (field as any).name;
      const value = formData[fieldId];

      if (field.required && isEmptyFieldValue(field, value)) {
        isValid = false;
      }
      // Validações de negócio também bloqueiam o envio ao vivo (ex.: dias
      // solicitados acima do saldo disponível).
      if (field.validation && value !== undefined && value !== '') {
        const mensagem = (field.validation as any)(value, formData);
        if (mensagem) {
          isValid = false;
          errosDeNegocio[fieldId] = mensagem;
        }
      }
    });

    setErrors(prev => {
      const next = { ...prev };
      let mudou = false;
      Object.entries(errosDeNegocio).forEach(([id, msg]) => {
        if (next[id] !== msg) { next[id] = msg; mudou = true; }
      });
      // Some sozinho quando o valor é corrigido. O 'Campo obrigatório' gravado
      // pelo envio não é apagado aqui — quem o limpa é o preenchimento.
      Object.keys(next).forEach(id => {
        if (!errosDeNegocio[id] && next[id] !== CAMPO_OBRIGATORIO) { delete next[id]; mudou = true; }
      });
      return mudou ? next : prev;
    });

    if (onValidityChange) {
      onValidityChange(isValid);
    }

  }, [formData, definition.processId, onValidityChange]);

  // Campos CALC (origin 'K') são DERIVADOS durante o render — nunca gravados no
  // estado. Isso elimina o loop de re-render que existia quando um efeito
  // recalculava e chamava setFormData observando o próprio formData. `formData`
  // só muda por interação do usuário (handleChange), então o memo é estável e
  // não dispara a si mesmo. No envio, os mesmos valores são recalculados para o
  // payload (ver computeDerivedFields no RHRequestForm).
  const computedData = useMemo(
    () => computeDerivedFields(definition, formData),
    [formData, definition]
  );

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const openCalendar = (fieldId: string, value: any) => {
    const current = localDateFromString(String(value ?? ''));
    const base = current ?? new Date();
    const anchor = dateAnchorRefs.current[fieldId];
    setCalendarDate(new Date(base.getFullYear(), base.getMonth(), 1));
    // Primeira posição usa altura estimada; o useLayoutEffect corrige com a real
    setCalendarPos(anchor ? computeCalendarPosition(anchor, CALENDAR_FALLBACK_HEIGHT) : null);
    setOpenCalendarField(fieldId);
  };

  const closeCalendar = () => {
    setOpenCalendarField(null);
    setCalendarPos(null);
  };

  // Grid do mês: células vazias até o primeiro dia da semana, depois os dias
  const generateMonthGrid = (year: number, month: number): (number | null)[] => {
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstWeekday).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(day);
    }
    return cells;
  };

  // Grava sempre como data LOCAL (dd/mm/aaaa) para não perder um dia por fuso
  const setDateValue = (fieldId: string, date: Date) => {
    handleChange(fieldId, localDateToDisplay(date));
    closeCalendar();
  };

  // Reposiciona com a altura real do popover assim que ele monta / muda de mês
  useLayoutEffect(() => {
    if (!openCalendarField) return;
    const anchor = dateAnchorRefs.current[openCalendarField];
    const calendar = calendarRef.current;
    if (!anchor || !calendar) return;
    const next = computeCalendarPosition(anchor, calendar.offsetHeight);
    setCalendarPos(prev =>
      prev && prev.top === next.top && prev.left === next.left && prev.width === next.width ? prev : next
    );
  }, [openCalendarField, calendarDate]);

  // Acompanha scroll/resize enquanto aberto; fecha se o campo sair da viewport
  useEffect(() => {
    if (!openCalendarField) return;

    const reposition = () => {
      const anchor = dateAnchorRefs.current[openCalendarField];
      if (!anchor) return closeCalendar();
      const rect = anchor.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return closeCalendar();
      setCalendarPos(computeCalendarPosition(anchor, calendarRef.current?.offsetHeight ?? CALENDAR_FALLBACK_HEIGHT));
    };

    // capture: true para pegar scroll de containers internos, não só da janela
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [openCalendarField]);

  // Fecha ao clicar fora (o anchor é ignorado para o botão poder alternar)
  useEffect(() => {
    if (!openCalendarField) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const anchor = dateAnchorRefs.current[openCalendarField];
      if (calendarRef.current?.contains(target) || anchor?.contains(target)) return;
      closeCalendar();
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openCalendarField]);

  const validate = () => {
    const currentStep = definition.steps[0];
    const fields = currentStep.fields;
    const newErrors: Record<string, string> = {};
    let firstErrorField: string | null = null;

    fields.forEach(field => {
      if (field.condition && !field.condition(formData)) return;
      
      const fieldId = (field as any).id || field.name;
      const value = formData[fieldId];
      if (field.required && isEmptyFieldValue(field, value)) {
        newErrors[fieldId] = CAMPO_OBRIGATORIO;
        if (!firstErrorField) firstErrorField = fieldId;
      }
      if (field.validation && value !== undefined) {
        const error = (field.validation as any)(value, formData);
        if (error) {
          newErrors[fieldId] = error;
          if (!firstErrorField) firstErrorField = fieldId;
        }
      }
    });

    setErrors(newErrors);

    if (firstErrorField) {
      const element = document.getElementById(`field-${firstErrorField}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (element?.querySelector('input, select, textarea') as HTMLElement)?.focus();
    }

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validate()) {
      // Recalcula os campos CALC no momento do envio para incluí-los no payload.
      onSubmit(computeDerivedFields(definition, formData));
    }
  };

  const renderField = (field: FormField) => {
    const fieldId = (field as any).id || (field as any).name;
    
    // Check condition
    if (field.condition && !field.condition(formData)) return null;

    const isReadOnlyField = readOnly || (field as any).origin === 'F' || (field as any).origin === 'K';
    
    // Lê de computedData: idêntico a formData para campos do usuário e já traz o
    // valor derivado para os campos CALC (origin 'K'), sem depender de estado.
    const rawValue = computedData[fieldId];
    let value = rawValue;
    if (value === undefined || value === null) {
      if (field.type === 'checklist' || (field as any).type === 'dependent-list') {
        value = [];
      } else if (field.type === 'boolean') {
        value = false;
      } else {
        value = '';
      }
    }
    const error = errors[fieldId];

    const gridClass = field.gridCols === 3 ? 'col-span-1 md:col-span-3' : field.gridCols === 2 ? 'col-span-1 md:col-span-2' : 'col-span-1';

    const Label = () => (
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 ml-1">
        {field.label} {field.required && <span className="text-red-500">*</span>}
        {/* origin 'F' não exibe selo — só o fundo levemente acinzentado indica leitura */}
        {field.origin === 'K' && <Badge variant="purple">CALC</Badge>}
      </label>
    );

    const ErrorMsg = () => error ? (
      <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    ) : null;

    // A base NÃO traz fundo nem cor de texto: quem define é o par
    // editável/leitura abaixo. Ter `bg-white` na base e `bg-gray-50` na variante
    // deixava as duas classes no mesmo elemento, e aí quem vence é a ordem do
    // CSS gerado pelo Tailwind — não a da string.
    const inputBaseClass = `w-full border ${error ? 'border-red-500' : 'border-gray-200'} rounded-[12px] px-4 py-2.5 text-[13px] font-bold focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`;
    const editableClass = 'bg-white text-gray-900 group-hover:border-gray-300';
    // Campo em leitura usa a superfície única do app (ui/ReadOnlyField). O CALC
    // mantém só o TOM do texto em roxo — o fundo é o mesmo cinza dos demais,
    // senão "calculado" não parece somente-leitura.
    const readOnlyClass = field.origin === 'K'
      ? `${READONLY_SURFACE} text-purple-800 font-black cursor-not-allowed`
      : READONLY_INPUT;
    const fieldStateClass = isReadOnlyField ? readOnlyClass : editableClass;

    const isColaborador = config.usuarioAtual.profile === 'Colaborador';
    const isCurrentUserTarget = definition.targetMode === 'CURRENT_USER';

    switch (field.type) {
      case 'zoom':
        if (isColaborador && isCurrentUserTarget) return null;

        const zoomEntity = field.zoomConfig?.entity;
        const isEmployeeZoom = !zoomEntity || zoomEntity === 'employee';

        // Limpa o alvo e todos os campos autopreenchidos (origin F).
        const clearSelection = () => {
          const updates: Record<string, any> = { [fieldId]: '', [`${fieldId}Id`]: '' };
          const currentStep = definition.steps[0];
          currentStep.fields.forEach(f => {
            if ((f as any).origin === 'F') updates[(f as any).id || (f as any).name] = '';
          });
          setFormData(prev => ({ ...prev, ...updates }));
        };

        const renderZoom = () => {
          const entity = field.zoomConfig?.entity;
          
          if (entity === 'approved-vacancy') {
            return <ApprovedVacancyZoom 
              label="" 
              placeholder={field.placeholder} 
              onSelect={(vaga) => {
                const updates: Record<string, any> = {
                  [fieldId]: vaga.title,
                  [`${fieldId}Id`]: vaga.id,
                };
                
                // Map FONTE fields
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  if ((f as any).origin === 'F') {
                    const fId = (f as any).id || (f as any).name;
                    const fName = fId.toLowerCase();
                    if (fName === 'cargo') updates[fId] = vaga.title;
                    if (fName === 'empresa') updates[fId] = vaga.company;
                    if (fName === 'filial') updates[fId] = vaga.branch;
                    if (fName === 'setor') updates[fId] = vaga.department || vaga.sector;
                    if (fName === 'centrocusto' || fName === 'centro-custo') updates[fId] = vaga.costCenter;
                    if (fName === 'quantidade') updates[fId] = vaga.quantity;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          if (entity === 'candidate') {
            return <CandidateZoom 
              label="" 
              placeholder={field.placeholder}
              vacancyId={formData.vagaId}
              onSelect={(cand) => {
                const updates: Record<string, any> = {
                  [fieldId]: cand.candidateName,
                  [`${fieldId}Id`]: cand.id,
                };
                
                // Map FONTE fields
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  const fId = (f as any).id || (f as any).name;
                  const fName = fId.toLowerCase();
                  if ((f as any).origin === 'F' || fId === 'nota') {
                    if (fName === 'email') updates[fId] = cand.email;
                    if (fName === 'telefone' || fName === 'phone') updates[fId] = cand.phone;
                    if (fName === 'origem') updates[fId] = cand.source;
                    if (fName === 'curriculo') updates[fId] = cand.resumeUrl;
                    if (fName === 'nota') updates[fId] = cand.score;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          if (entity === 'approved-candidate') {
            return <ApprovedCandidateZoom 
              label="" 
              placeholder={field.placeholder}
              onSelect={(cand) => {
                const updates: Record<string, any> = {
                  [fieldId]: cand.candidateName,
                  [`${fieldId}Id`]: cand.id,
                };
                
                // Map FONTE fields
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  if ((f as any).origin === 'F') {
                    const fId = (f as any).id || (f as any).name;
                    const fName = fId.toLowerCase();
                    if (fName === 'email') updates[fId] = cand.email;
                    if (fName === 'telefone' || fName === 'phone') updates[fId] = cand.phone;
                    if (fName === 'vaga') updates[fId] = cand.vaga?.title;
                    if (fName === 'cargo') updates[fId] = cand.vaga?.title;
                    if (fName === 'empresa') updates[fId] = cand.vaga?.company;
                    if (fName === 'filial') updates[fId] = cand.vaga?.branch;
                    if (fName === 'setor') updates[fId] = cand.vaga?.sector;
                    if (fName === 'centrocusto' || fName === 'centro-custo') updates[fId] = cand.vaga?.costCenter;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          if (entity === 'employee-admitted') {
            return <RecentlyHiredEmployeeZoom 
              label="" 
              placeholder={field.placeholder}
              onSelect={(emp) => {
                const updates: Record<string, any> = {
                  [fieldId]: emp.name,
                  [`${fieldId}Id`]: emp.id,
                };
                
                // Map FONTE fields
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  const fId = (f as any).id || (f as any).name;
                  const fName = fId.toLowerCase();
                  if ((f as any).origin === 'F') {
                    if (fName === 'cargo') updates[fId] = emp.role;
                    if (fName === 'gestor') updates[fId] = emp.manager;
                    if (fName === 'empresafilial') updates[fId] = `${emp.company} - ${emp.branch}`;
                    if (fName === 'dataadmissao' || fName === 'admissao') updates[fId] = emp.admissionDate;
                    if (fName === 'matricula') updates[fId] = emp.registration;
                    if (fName === 'setor') updates[fId] = emp.department;
                    if (fName === 'centrocusto' || fName === 'centro-custo') updates[fId] = emp.costCenter;
                    if (fName === 'salario') updates[fId] = emp.salary;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          if (entity === 'manager') {
            return <ManagerZoom 
              label="" 
              placeholder={field.placeholder}
              onSelect={(mgr) => {
                const updates: Record<string, any> = {
                  [fieldId]: mgr.name,
                  [`${fieldId}Id`]: mgr.id,
                  [`${fieldId}Role`]: mgr.role
                };
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          if (entity === 'dependent') {
            return <DependentZoom 
              label="" 
              placeholder={field.placeholder}
              employeeId={formData.employeeId || config.usuarioAtual.employeeId}
              onSelect={(dep) => {
                const updates: Record<string, any> = {
                  [fieldId]: dep.name,
                  [`${fieldId}Id`]: dep.id,
                };
                
                // Map FONTE fields
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  if ((f as any).origin === 'F') {
                    const fId = (f as any).id || (f as any).name;
                    const fName = fId.toLowerCase();
                    if (fName === 'parentesco') updates[fId] = dep.relationship;
                    if (fName === 'cpf') updates[fId] = dep.cpf;
                    if (fName === 'datanascimento') updates[fId] = dep.birthDate;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }} 
            />;
          }

          // Default EmployeeZoom
          return (
            <EmployeeZoom 
              onSelect={(emp) => {
                const updates: Record<string, any> = {
                  [`${fieldId}Id`]: emp.id,
                  [fieldId]: emp.name
                };
                
                // Common fields mapping
                const currentStep = definition.steps[0];
                currentStep.fields.forEach(f => {
                  const f_id = (f as any).id || (f as any).name;
                  const fName = f_id.toLowerCase();
                  if (f.origin === 'F') {
                    if (fName === 'matricula') updates[f_id] = emp.registration;
                    if (fName === 'cargo' || fName === 'cargoatual' || fName === 'cargoorigem') updates[f_id] = emp.role;
                    if (fName === 'setor' || fName === 'deptoorigem' || fName === 'setoratual' || fName === 'setororigem') updates[f_id] = emp.department;
                    if (fName === 'filial' || fName === 'filialatual' || fName === 'filialorigem') updates[f_id] = emp.branch;
                    if (fName === 'centrocusto' || fName === 'centrocustoatual' || fName === 'ccatual' || fName === 'ccorigem' || fName === 'centro-custo') updates[f_id] = emp.costCenter;
                    if (fName === 'gestor' || fName === 'gestordireto' || fName === 'gestoratual' || fName === 'gestororigem') updates[f_id] = emp.manager;
                    if (fName === 'unidade' || fName === 'unidadeatual' || fName === 'empresa' || fName === 'empresaatual' || fName === 'empresaorigem') updates[f_id] = emp.company;
                    if (fName === 'dataadmissao' || fName === 'admissao') updates[f_id] = emp.admissionDate;
                    if (fName === 'salario' || fName === 'salarioatual' || fName === 'salariorigem') updates[f_id] = emp.salary;
                    if (fName === 'cpf') updates[f_id] = emp.cpf;
                    if (fName === 'email') updates[f_id] = emp.email;
                    if (fName === 'telefone' || fName === 'phone') updates[f_id] = emp.phone;
                    if (fName === 'periodoaquisitivo') updates[f_id] = emp.vacationRecords?.[0]?.acquisitivePeriod || '';
                    if (fName === 'saldo') updates[f_id] = emp.vacationRecords?.[0]?.balance || 0;
                  }
                });
                setFormData(prev => ({ ...prev, ...updates }));
              }}
              value={value ? String(value) : ''}
              selectedId={formData[`${fieldId}Id`]}
              onClear={clearSelection}
              readOnly={isReadOnlyField}
              label=""
              placeholder={field.placeholder}
            />
          );
        };

        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 space-y-3">
            <Label />
            {/* EmployeeZoom mantém a linha (Empresa/Filial/busca) visível e gerencia
                o estado selecionado internamente. Demais entidades trocam para o card. */}
            {isEmployeeZoom ? renderZoom() : (!value ? renderZoom() : (
              <div className="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-[12px]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-black text-[10px]">
                    {String(value).charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-gray-900">{value}</p>
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Selecionado</p>
                  </div>
                </div>
                {!isReadOnlyField && (
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1.5 hover:bg-orange-100 rounded-full text-orange-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ))}
            <ErrorMsg />
          </div>
        );

      case 'text':
      case 'number':
      case 'date':
      case 'datetime':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="relative group">
              {field.type === 'date' ? (
                <>
                  <div className="relative" ref={el => { dateAnchorRefs.current[fieldId] = el; }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={value !== null && value !== undefined ? formatDateForDisplay(value) : ''}
                      onChange={(e) => handleChange(fieldId, maskDateValue(e.target.value))}
                      onFocus={() => !isReadOnlyField && openCalendar(fieldId, value)}
                      disabled={isReadOnlyField}
                      placeholder={field.placeholder || 'dd/mm/aaaa'}
                      className={`${inputBaseClass} ${fieldStateClass}`}
                    />
                    {!isReadOnlyField && (
                      <button
                        type="button"
                        onClick={() => openCalendarField === fieldId ? closeCalendar() : openCalendar(fieldId, value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-400 hover:bg-gray-50 transition-colors"
                      >
                        <Calendar size={16} />
                      </button>
                    )}
                  </div>
                  {openCalendarField === fieldId && !isReadOnlyField && calendarPos && createPortal(
                    <div
                      ref={calendarRef}
                      style={{
                        position: 'fixed',
                        top: calendarPos.top,
                        left: calendarPos.left,
                        width: calendarPos.width,
                        maxHeight: `calc(100vh - ${VIEWPORT_MARGIN * 2}px)`,
                        overflowY: 'auto',
                      }}
                      className="z-[1000] rounded-[20px] border border-gray-200 bg-white shadow-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <button
                          type="button"
                          onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {'<'}
                        </button>
                        <div className="text-sm font-black text-gray-900 uppercase tracking-[0.24em]">
                          {MONTH_LABELS[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                        </div>
                        <button
                          type="button"
                          onClick={() => setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                          className="text-gray-500 hover:text-gray-900"
                        >
                          {'>'}
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black uppercase text-gray-400 mb-2">
                        {WEEK_LABELS.map(day => (
                          <span key={day}>{day}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-sm">
                        {generateMonthGrid(calendarDate.getFullYear(), calendarDate.getMonth()).map((day, index) => {
                          if (!day) {
                            return <div key={index} className="h-9" />;
                          }
                          const candidateDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                          const isSelected = localDateFromString(String(value))?.getTime() === candidateDate.getTime();
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => setDateValue(fieldId, candidateDate)}
                              className={`h-9 rounded-full ${isSelected ? 'bg-orange-600 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body
                  )}
                </>
              ) : (
                <>
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'datetime' ? 'datetime-local' : 'text'}
                    value={value !== null && value !== undefined ? String(value) : ''}
                    onChange={(e) => handleChange(fieldId, field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
                    disabled={isReadOnlyField}
                    placeholder={field.placeholder}
                    className={`${inputBaseClass} ${fieldStateClass}`}
                  />
                  {field.type === 'datetime' && !isReadOnlyField && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />}
                </>
              )}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'currency':
        // Valor vindo do sistema (origin 'F'/'K') não é editável: exibe o
        // montante já formatado em BRL em vez de um input numérico cru.
        if (isReadOnlyField) {
          return (
            <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
              <Label />
              <div className={`${inputBaseClass} ${readOnlyClass}`}>
                {value === '' || value === null || value === undefined
                  ? '—'
                  : Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </div>
              <ErrorMsg />
            </div>
          );
        }
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">
                R$
              </div>
              <input
                type="number"
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={(e) => handleChange(fieldId, e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isReadOnlyField}
                className={`${inputBaseClass} pl-10 ${fieldStateClass}`}
              />
            </div>
            <ErrorMsg />
          </div>
        );

      case 'percent':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="relative group">
              <input
                type="number"
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={(e) => handleChange(fieldId, e.target.value === '' ? '' : Number(e.target.value))}
                disabled={isReadOnlyField}
                className={`${inputBaseClass} pr-10 ${fieldStateClass}`}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-[13px]">
                %
              </div>
            </div>
            <ErrorMsg />
          </div>
        );

      case 'select':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="relative group">
              <select
                value={value !== null && value !== undefined ? String(value) : ''}
                onChange={(e) => handleChange(fieldId, e.target.value)}
                disabled={isReadOnlyField}
                className={`${inputBaseClass} appearance-none pr-10 ${fieldStateClass}`}
              >
                <option value="">Selecione...</option>
                {field.options?.map(opt => (
                  <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                    {typeof opt === 'string' ? opt : opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            </div>
            <ErrorMsg />
          </div>
        );

      case 'multiselect':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <Label />
            <div className={`flex flex-wrap gap-2 p-3 border rounded-[12px] min-h-[46px] ${isReadOnlyField ? READONLY_INPUT : 'bg-white border-gray-200'}`}>
              {(value || []).map((v: string) => (
                <span key={v} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-700 text-[11px] font-black rounded-[8px] border border-orange-100">
                  {v}
                  {!isReadOnlyField && (
                    <button type="button" onClick={() => handleChange(fieldId, value.filter((i: string) => i !== v))}>
                      <X size={12} />
                    </button>
                  )}
                </span>
              ))}
              {!isReadOnlyField && (
                <select
                  className="flex-1 bg-transparent border-none text-[12px] font-bold outline-none"
                  onChange={(e) => {
                    if (e.target.value && !(value || []).includes(e.target.value)) {
                      handleChange(fieldId, [...(value || []), e.target.value]);
                    }
                    e.target.value = '';
                  }}
                >
                  <option value="">Adicionar...</option>
                  {field.options?.map((opt: any) => (
                    <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value}>
                      {typeof opt === 'string' ? opt : opt.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'textarea': {
        const textValue = value !== null && value !== undefined ? String(value) : '';
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <Label />
            <div className="relative">
              <textarea
                value={textValue}
                onChange={(e) => handleChange(fieldId, e.target.value)}
                disabled={isReadOnlyField}
                rows={3}
                maxLength={field.maxLength}
                placeholder={field.placeholder}
                className={`${inputBaseClass} resize-none ${field.maxLength ? 'pb-6' : ''} ${fieldStateClass}`}
              />
              {field.maxLength && (
                <span className="absolute bottom-2 right-3 text-[10px] font-bold text-gray-400 tabular-nums pointer-events-none">
                  {textValue.length}/{field.maxLength}
                </span>
              )}
            </div>
            <ErrorMsg />
          </div>
        );
      }

      case 'boolean':
      case 'toggle':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => !isReadOnlyField && handleChange(fieldId, !value)}
              className={`w-10 h-5 rounded-full transition-all relative ${value ? 'bg-orange-500' : 'bg-gray-200'} ${isReadOnlyField ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${value ? 'left-6' : 'left-1'}`} />
            </button>
            <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{field.label}</span>
          </div>
        );

      case 'checkbox':
        // Aceite: a frase inteira é clicável e o rótulo mantém a caixa original
        // (são declarações, não títulos de campo).
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <button
              type="button"
              disabled={isReadOnlyField}
              aria-pressed={!!value}
              onClick={() => !isReadOnlyField && handleChange(fieldId, !value)}
              className={`w-full flex items-start gap-3 p-4 rounded-[16px] border text-left transition-all ${
                value ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/10'
                  : isReadOnlyField ? READONLY_INPUT
                  : error ? 'bg-white border-red-500'
                  : 'bg-white border-gray-100 hover:border-gray-200'
              } ${isReadOnlyField ? 'cursor-not-allowed' : ''}`}
            >
              <span className={`w-5 h-5 shrink-0 rounded-[6px] border flex items-center justify-center transition-all ${value ? 'bg-orange-500 border-orange-500' : isReadOnlyField ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200'}`}>
                {value && <Check size={14} className="text-white" />}
              </span>
              <span className={`text-[13px] font-bold leading-snug ${value ? 'text-orange-800' : isReadOnlyField ? READONLY_TEXT : 'text-gray-700'}`}>
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </span>
            </button>
            <ErrorMsg />
          </div>
        );

      case 'signature':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 space-y-3">
            <Label />
            {!value ? (
              <button
                type="button"
                disabled={isReadOnlyField}
                onClick={() => handleChange(fieldId, {
                  signed: true,
                  date: new Date().toISOString(),
                  name: config.usuarioAtual?.name || formData.colaborador || formData.solicitante || 'Usuário',
                  registration: formData.matricula || ''
                })}
                className={`w-full h-32 border-2 rounded-[20px] flex flex-col items-center justify-center gap-3 transition-all group ${
                  isReadOnlyField
                    ? `${READONLY_INPUT} border-solid`
                    : `border-dashed hover:bg-gray-50 hover:border-orange-200 ${error ? 'border-red-300' : 'border-gray-100'}`
                }`}
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 group-hover:text-orange-500 group-hover:scale-110 transition-all shadow-sm">
                  <Edit2 size={20} />
                </div>
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Clique para assinar digitalmente</p>
                <p className="text-[10px] font-bold text-gray-400">
                  Registra nome, matrícula e data/hora do aceite
                </p>
              </button>
            ) : (
              <div className="p-6 bg-green-50 border border-green-100 rounded-[20px] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm border border-green-50">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[13px] font-black text-green-900">Assinado Digitalmente</p>
                    <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">
                      Por: {value.name}{value.registration ? ` • Matrícula ${value.registration}` : ''} em {new Date(value.date).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
                {!isReadOnlyField && (
                  <button type="button" onClick={() => handleChange(fieldId, null)} className="text-green-600 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest">Remover</button>
                )}
              </div>
            )}
            <ErrorMsg />
          </div>
        );

      case 'calc':
        // Mesmo fundo de qualquer campo em leitura — o roxo fica só no texto e
        // no selo CALC do rótulo, que é o que identifica "o sistema calculou".
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className={`p-3 border rounded-[12px] text-[13px] font-black text-purple-800 ${READONLY_SURFACE}`}>
              {value}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'status':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${value === 'Concluído' ? 'bg-green-500' : 'bg-amber-500'}`} />
              <span className="text-[12px] font-black uppercase tracking-wider">{value || 'Pendente'}</span>
            </div>
          </div>
        );

      case 'file': {
        const fileName = value ? String(value) : '';
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <Label />
            {fileName ? (
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-[16px]">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-white rounded-[12px] flex items-center justify-center text-orange-500 shadow-sm shrink-0">
                    <FileText size={16} />
                  </div>
                  <p className="text-[12px] font-bold text-gray-700 truncate">{fileName}</p>
                </div>
                {!isReadOnlyField && (
                  <button
                    type="button"
                    onClick={() => handleChange(fieldId, '')}
                    className="p-1.5 hover:bg-gray-200 rounded-full text-gray-400 transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            ) : isReadOnlyField ? (
              // Em leitura não há o que arrastar: a área vira a mesma caixa
              // cinza dos outros campos, dizendo que não há anexo.
              <div className={`flex items-center gap-3 p-4 border rounded-[16px] ${READONLY_INPUT}`}>
                <FileText size={16} className="text-gray-400 shrink-0" />
                <p className="text-[12px] font-bold">Nenhum arquivo anexado.</p>
              </div>
            ) : (
              <label className="block border-2 border-dashed border-gray-100 rounded-[20px] p-8 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-orange-200 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleChange(fieldId, file.name);
                  }}
                />
                <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform text-gray-400 group-hover:text-orange-500">
                  <Plus size={24} />
                </div>
                <p className="text-[12px] font-black text-gray-900">Arraste e solte os arquivos aqui ou clique para selecionar</p>
                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">Formatos permitidos: PDF, JPG, PNG. Tamanho máximo: 10MB por arquivo.</p>
              </label>
            )}
            <ErrorMsg />
          </div>
        );
      }

      case 'checklist':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 space-y-3">
            <Label />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {field.options?.map((opt: any) => {
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isChecked = (value || []).includes(optLabel);
                return (
                  <button
                    key={optLabel}
                    type="button"
                    // `isReadOnlyField`, não `readOnly`: um checklist com origin
                    // 'F' também é dado que o sistema trouxe.
                    disabled={isReadOnlyField}
                    onClick={() => {
                      const current = value || [];
                      const next = isChecked ? current.filter((i: any) => i !== optLabel) : [...current, optLabel];
                      handleChange(fieldId, next);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-[12px] border text-left transition-all ${
                      isChecked ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/10'
                        : isReadOnlyField ? READONLY_INPUT
                        : 'bg-white border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${isChecked ? 'bg-orange-500 border-orange-500' : 'bg-gray-50 border-gray-200'}`}>
                      {isChecked && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-[12px] font-bold ${isChecked ? 'text-orange-700' : 'text-gray-600'}`}>{optLabel}</span>
                  </button>
                );
              })}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'dependent-list':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <Label />
              {!isReadOnlyField && (
                <Button variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => {
                  const current = value || [];
                  handleChange(fieldId, [...current, { name: '', birthDate: '', relationship: '', action: 'inclusao' }]);
                }}>
                  Adicionar Dependente
                </Button>
              )}
            </div>
            <div className="space-y-3">
              {(value || []).map((dep: any, idx: number) => (
                <div key={idx} className={`p-4 rounded-[16px] border grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-sm ${isReadOnlyField ? READONLY_SURFACE : 'bg-white border-gray-100'}`}>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-300 uppercase mb-1">Nome</label>
                      <input
                        type="text"
                        value={dep.name ?? ''}
                        disabled={isReadOnlyField}
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].name = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className={`w-full bg-transparent border-b border-gray-100 text-[13px] font-bold outline-none py-1 focus:border-orange-500 transition-colors ${isReadOnlyField ? `${READONLY_TEXT} cursor-not-allowed` : ''}`}
                      />
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-300 uppercase mb-1">Parentesco</label>
                      <select
                        value={dep.relationship ?? ''}
                        disabled={isReadOnlyField}
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].relationship = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className={`w-full bg-transparent border-b border-gray-100 text-[13px] font-bold outline-none py-1 focus:border-orange-500 transition-colors ${isReadOnlyField ? `${READONLY_TEXT} cursor-not-allowed` : ''}`}
                      >
                         <option value="">Selecione...</option>
                         <option>Filho(a)</option>
                         <option>Cônjuge</option>
                         <option>Pai/Mãe</option>
                      </select>
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-300 uppercase mb-1">Ação</label>
                      <select
                        value={dep.action ?? ''}
                        disabled={isReadOnlyField}
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].action = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className={`w-full bg-transparent border-b border-gray-100 text-[11px] font-black uppercase outline-none py-1 ${
                          isReadOnlyField ? `${READONLY_TEXT} cursor-not-allowed` : dep.action === 'exclusao' ? 'text-red-500' : 'text-green-500'
                        }`}
                      >
                         <option value="inclusao">Inclusão</option>
                         <option value="alteracao">Alteração</option>
                         <option value="exclusao">Exclusão</option>
                      </select>
                   </div>
                   <div className="flex justify-end">
                      {!isReadOnlyField && (
                        <button
                          onClick={() => {
                            const next = value.filter((_: any, i: number) => i !== idx);
                            handleChange(fieldId, next);
                          }}
                          className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                   </div>
                </div>
              ))}
              {(value || []).length === 0 && (
                <div className="py-8 text-center bg-gray-50/30 rounded-[16px] border border-dashed border-gray-200">
                   <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Nenhum registro adicionado</p>
                </div>
              )}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'radio':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="flex flex-wrap gap-3 mt-1">
              {field.options?.map((opt: any) => {
                const optLabel = typeof opt === 'string' ? opt : opt.label;
                const isSelected = value === optLabel;
                return (
                  <button
                    key={optLabel}
                    type="button"
                    // Ver checklist: origin 'F'/'K' também bloqueia a escolha.
                    disabled={isReadOnlyField}
                    onClick={() => handleChange(fieldId, optLabel)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] border transition-all ${
                      isSelected ? 'bg-orange-50 border-orange-500 text-orange-700 ring-2 ring-orange-500/10'
                        : isReadOnlyField ? READONLY_INPUT
                        : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-orange-500' : 'border-gray-300'}`}>
                      {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                    </div>
                    <span className="text-[12px] font-bold">{optLabel}</span>
                  </button>
                );
              })}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'section':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 mt-6 mb-2">
            <h3 className="text-[12px] font-bold text-brand-primary uppercase tracking-wider border-b border-brand-border pb-1">
              {field.label}
            </h3>
          </div>
        );

      case 'info': {
        // Por padrão é nota de apoio (discreta). Com `highlight`, o texto é uma
        // declaração dirigida ao usuário (ex.: aceite) e ganha destaque.
        const isNote = !(field as any).highlight;
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
             <div className={`p-4 border rounded-[12px] flex items-start gap-3 ${isNote ? 'bg-gray-50 border-gray-100' : 'bg-orange-50/40 border-orange-100'}`}>
                <div className={`w-5 h-5 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-gray-50 ${isNote ? 'text-gray-400' : 'text-orange-500'}`}>
                   <Info size={12} />
                </div>
                <p className={`leading-relaxed ${isNote ? 'text-[12px] font-bold text-gray-500 italic' : 'text-[13px] font-black text-gray-800'}`}>
                   {field.label}
                </p>
             </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Group fields by section
  const fields = definition.steps[0].fields;
  const hasSections = fields.some(f => f.section);

  const renderFields = () => {
    if (!hasSections) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
          {fields.map(renderField)}
        </div>
      );
    }

    // A visibilidade da seção deriva dos campos: se nenhum campo passa na sua
    // `condition`, a seção inteira some (ver `visibleFields` abaixo). Não há
    // regra por nome de seção — vale para qualquer processo.
    const sections = Array.from(new Set(fields.map(f => f.section || 'Geral')));

    return (
      <div className="space-y-8">
        {sections.map(section => {
          const sectionFields = fields.filter(f => (f.section || 'Geral') === section);
          const visibleFields = sectionFields.filter(f => !f.condition || f.condition(formData));
          
          if (visibleFields.length === 0) return null;

          return (
            <div key={section} className="bg-white border border-gray-100 rounded-[20px] overflow-hidden shadow-sm">
              <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                <h3 className="text-[13px] font-black text-gray-900 uppercase tracking-widest">{section}</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-8">
                  {sectionFields.map(renderField)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <form 
      id="rh-request-form" 
      onSubmit={handleSubmit} 
      className="space-y-10"
      noValidate
    >
      {renderFields()}
      {!hideActions && (
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
           <Button variant="outline" onClick={onCancel}>Cancelar</Button>
           <Button type="submit" variant="primary">Salvar</Button>
        </div>
      )}
    </form>
  );
}

function Badge({ children, variant = 'gray', className = '' }: { children: React.ReactNode, variant?: 'gray' | 'blue' | 'purple', className?: string }) {
  const variants = {
    gray: 'bg-gray-100 text-gray-600',
    blue: 'bg-blue-50 text-blue-600 border border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border border-purple-100',
  };

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
