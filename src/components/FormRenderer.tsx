import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { FormField, ProcessDefinition } from '../types';
import { Button } from './ui/Button';
import { 
  FileText, Plus, Trash2, Calendar, DollarSign, Percent, 
  Clock, User, Hash, Search, List, ChevronDown, Check,
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
const CALENDAR_GAP = 8; // espaço entre o campo e o popover
const VIEWPORT_MARGIN = 8; // margem mínima até a borda da viewport

type CalendarPosition = { top: number; left: number; width: number };

// Posiciona o popover em coordenadas de viewport (position: fixed), com flip
// para cima quando não cabe abaixo e clamp para nunca sair da tela.
const computeCalendarPosition = (anchor: HTMLElement, height: number): CalendarPosition => {
  const rect = anchor.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const width = Math.min(CALENDAR_WIDTH, viewportWidth - VIEWPORT_MARGIN * 2);
  const spaceBelow = viewportHeight - rect.bottom - CALENDAR_GAP;
  const spaceAbove = rect.top - CALENDAR_GAP;

  // Só inverte se não couber embaixo E houver mais espaço em cima
  const openUpward = spaceBelow < height && spaceAbove > spaceBelow;
  const rawTop = openUpward ? rect.top - CALENDAR_GAP - height : rect.bottom + CALENDAR_GAP;

  const maxTop = viewportHeight - height - VIEWPORT_MARGIN;
  const top = maxTop < VIEWPORT_MARGIN ? VIEWPORT_MARGIN : Math.min(Math.max(rawTop, VIEWPORT_MARGIN), maxTop);
  const left = Math.min(Math.max(rect.left, VIEWPORT_MARGIN), viewportWidth - width - VIEWPORT_MARGIN);

  return { top, left, width };
};

const localDateFromString = (value: string) => {
  if (!value) return null;
  const str = String(value).trim();
  const dmYMatch = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (dmYMatch) {
    const day = Number(dmYMatch[1]);
    const month = Number(dmYMatch[2]) - 1;
    const year = Number(dmYMatch[3]);
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }
  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]) - 1;
    const day = Number(isoMatch[3]);
    const date = new Date(year, month, day);
    return date.getFullYear() === year && date.getMonth() === month && date.getDate() === day ? date : null;
  }
  return null;
};

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
          saldo: 30
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

  // Sync with initialData if it changes
  useEffect(() => {
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
  }, [formData.tipoRequisicao, definition.steps]); // Trigger specifically when tipoRequisicao changes to follow requirement

  // Notify parent of changes and validity
  useEffect(() => {
    if (onDataChange) {
      onDataChange(formData);
    }
    
    const currentStep = definition.steps[0];
    if (!currentStep) return;
    const fields = currentStep.fields;
    let isValid = true;
    
    fields.forEach(field => {
      // Check section visibility for Process '1'
      if (definition.processId === '1') {
        const fieldSection = field.section || 'Geral';
        const tipo = formData.tipoRequisicao;
        if (fieldSection === 'Reposição' && tipo !== 'reposicao') return;
        if (fieldSection === 'Transformação' && tipo !== 'transformacao') return;
      }

      if (field.condition && !field.condition(formData)) return;
      
      const fieldId = field.id || (field as any).name;
      const value = formData[fieldId];
      
      if (field.required && (value === undefined || value === null || value === '')) {
        isValid = false;
      }
    });

    if (onValidityChange) {
      onValidityChange(isValid);
    }
    
  }, [formData, definition.processId, onValidityChange]);

  // Handle calculations
  useEffect(() => {
    const currentStep = definition.steps[0];
    const fields = currentStep.fields;
    let hasChanged = false;
    const newData = { ...formData };

    fields.forEach(field => {
      const fieldId = field.id || (field as any).name;
      if ((field as any).origin === 'K' && field.calculate) {
        const newValue = field.calculate(newData);
        if (JSON.stringify(newData[fieldId]) !== JSON.stringify(newValue)) {
          newData[fieldId] = newValue;
          hasChanged = true;
        }
      }
    });

    if (hasChanged) {
      setFormData(newData);
    }
  }, [formData, definition.steps]);

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
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldId] = 'Campo obrigatório';
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
      onSubmit(formData);
    }
  };

  const renderField = (field: FormField) => {
    const fieldId = (field as any).id || (field as any).name;
    
    // Check condition
    if (field.condition && !field.condition(formData)) return null;

    const isReadOnlyField = readOnly || (field as any).origin === 'F' || (field as any).origin === 'K';
    
    if (hideActions && (field.type === 'signature' || field.type === 'file')) return null;

    const rawValue = formData[fieldId];
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
        {field.origin === 'F' && (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-[4px] border border-blue-100 cursor-help" title="Campo preenchido automaticamente pelo sistema (Somente Leitura)">
            <Badge variant="blue">FONTE</Badge>
            <Clock size={8} />
          </div>
        )}
        {field.origin === 'K' && <Badge variant="purple">CALC</Badge>}
      </label>
    );

    const ErrorMsg = () => error ? (
      <p className="text-[10px] font-bold text-red-500 mt-1 ml-1 animate-in fade-in slide-in-from-top-1">
        {error}
      </p>
    ) : null;

    const inputBaseClass = `w-full bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-[12px] px-4 py-2.5 text-[13px] font-bold text-gray-900 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all`;
    const readOnlyClass = field.origin === 'F' ? 'bg-blue-50/20 border-blue-100 text-blue-900' : field.origin === 'K' ? 'bg-purple-50/20 border-purple-100 text-purple-900 font-black' : 'bg-gray-50 text-gray-500 cursor-not-allowed';

    const isColaborador = config.usuarioAtual.profile === 'Colaborador';
    const isCurrentUserTarget = definition.targetMode === 'CURRENT_USER';

    switch (field.type) {
      case 'zoom':
        if (isColaborador && isCurrentUserTarget) return null;

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
              label=""
              placeholder={field.placeholder}
            />
          );
        };

        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3 space-y-3">
            <Label />
            {!value ? renderZoom() : (
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
                    onClick={() => {
                      const updates: Record<string, any> = { [fieldId]: '' };
                      const currentStep = definition.steps[0];
                      currentStep.fields.forEach(f => {
                         if ((f as any).origin === 'F') updates[(f as any).id || (f as any).name] = '';
                      });
                      setFormData(prev => ({ ...prev, ...updates }));
                    }}
                    className="p-1.5 hover:bg-orange-100 rounded-full text-orange-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
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
                      className={`${inputBaseClass} ${isReadOnlyField ? readOnlyClass : 'group-hover:border-gray-300'}`}
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
                    className={`${inputBaseClass} ${isReadOnlyField ? readOnlyClass : 'group-hover:border-gray-300'}`}
                  />
                  {field.type === 'datetime' && !isReadOnlyField && <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />}
                </>
              )}
            </div>
            <ErrorMsg />
          </div>
        );

      case 'currency':
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
                className={`${inputBaseClass} pl-10 ${isReadOnlyField ? readOnlyClass : 'group-hover:border-gray-300'}`}
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
                className={`${inputBaseClass} pr-10 ${isReadOnlyField ? readOnlyClass : 'group-hover:border-gray-300'}`}
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
                className={`${inputBaseClass} appearance-none pr-10 ${isReadOnlyField ? readOnlyClass : 'group-hover:border-gray-300'}`}
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
            <div className="flex flex-wrap gap-2 p-3 bg-white border border-gray-200 rounded-[12px] min-h-[46px]">
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

      case 'textarea':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <Label />
            <textarea
              value={value !== null && value !== undefined ? String(value) : ''}
              onChange={(e) => handleChange(fieldId, e.target.value)}
              disabled={isReadOnlyField}
              rows={3}
              placeholder={field.placeholder}
              className={`${inputBaseClass} resize-none ${isReadOnlyField ? readOnlyClass : 'hover:border-gray-300'}`}
            />
            <ErrorMsg />
          </div>
        );

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
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => !isReadOnlyField && handleChange(fieldId, !value)}
              className={`w-5 h-5 rounded-[6px] border flex items-center justify-center transition-all ${value ? 'bg-orange-500 border-orange-500' : 'bg-white border-gray-200'} ${isReadOnlyField ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {value && <Check size={14} className="text-white" />}
            </button>
            <span className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{field.label}</span>
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
                onClick={() => handleChange(fieldId, { signed: true, date: new Date().toISOString(), name: formData.solicitante || 'Usuário' })}
                className="w-full h-32 border-2 border-dashed border-gray-100 rounded-[20px] flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-orange-200 transition-all group"
              >
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-300 group-hover:text-orange-500 group-hover:scale-110 transition-all shadow-sm">
                  <Edit2 size={20} />
                </div>
                <p className="text-[12px] font-black text-gray-400 uppercase tracking-widest">Clique para assinar digitalmente</p>
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
                      Por: {value.name} em {new Date(value.date).toLocaleString('pt-BR')}
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
        return (
          <div key={fieldId} id={`field-${fieldId}`} className={gridClass}>
            <Label />
            <div className="p-3 bg-purple-50/20 border border-purple-100 rounded-[12px] text-[13px] font-black text-purple-700">
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

      case 'file':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
            <Label />
            <div className="border-2 border-dashed border-gray-100 rounded-[20px] p-8 text-center bg-gray-50/50 hover:bg-gray-50 hover:border-orange-200 transition-all cursor-pointer group">
              <div className="w-12 h-12 bg-white rounded-[16px] flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform text-gray-400 group-hover:text-orange-500">
                <Plus size={24} />
              </div>
              <p className="text-[12px] font-black text-gray-900">Clique ou arraste o arquivo</p>
              <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider">PDF, PNG ou JPG (máx 10MB)</p>
            </div>
            <ErrorMsg />
          </div>
        );

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
                    disabled={readOnly}
                    onClick={() => {
                      const current = value || [];
                      const next = isChecked ? current.filter((i: any) => i !== optLabel) : [...current, optLabel];
                      handleChange(fieldId, next);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-[12px] border text-left transition-all ${isChecked ? 'bg-orange-50 border-orange-200 ring-2 ring-orange-500/10' : 'bg-white border-gray-100 hover:border-gray-200'}`}
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
              {!readOnly && (
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
                <div key={idx} className="bg-white p-4 rounded-[16px] border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end shadow-sm">
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-300 uppercase mb-1">Nome</label>
                      <input 
                        type="text" 
                        value={dep.name ?? ''} 
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].name = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className="w-full border-b border-gray-100 text-[13px] font-bold outline-none py-1 focus:border-orange-500 transition-colors" 
                      />
                   </div>
                   <div className="col-span-1">
                      <label className="block text-[10px] font-black text-gray-300 uppercase mb-1">Parentesco</label>
                      <select 
                        value={dep.relationship ?? ''} 
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].relationship = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className="w-full border-b border-gray-100 text-[13px] font-bold outline-none py-1 focus:border-orange-500 transition-colors"
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
                        onChange={(e) => {
                          const next = [...value];
                          next[idx].action = e.target.value;
                          handleChange(fieldId, next);
                        }}
                        className={`w-full border-b border-gray-100 text-[11px] font-black uppercase outline-none py-1 ${dep.action === 'exclusao' ? 'text-red-500' : 'text-green-500'}`}
                      >
                         <option value="inclusao">Inclusão</option>
                         <option value="alteracao">Alteração</option>
                         <option value="exclusao">Exclusão</option>
                      </select>
                   </div>
                   <div className="flex justify-end">
                      <button 
                        onClick={() => {
                          const next = value.filter((_: any, i: number) => i !== idx);
                          handleChange(fieldId, next);
                        }}
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
                    disabled={readOnly}
                    onClick={() => handleChange(fieldId, optLabel)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[12px] border transition-all ${isSelected ? 'bg-orange-50 border-orange-500 text-orange-700 ring-2 ring-orange-500/10' : 'bg-white border-gray-100 text-gray-600 hover:border-gray-200'}`}
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

      case 'info':
        return (
          <div key={fieldId} id={`field-${fieldId}`} className="col-span-1 md:col-span-3">
             <div className="p-4 bg-gray-50 border border-gray-100 rounded-[12px] flex items-start gap-3">
                <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center text-gray-400 shrink-0 shadow-sm border border-gray-50">
                   <Info size={12} />
                </div>
                <p className="text-[12px] font-bold text-gray-500 leading-relaxed italic">
                   {field.label}
                </p>
             </div>
          </div>
        );

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

    const sections = Array.from(new Set(fields.map(f => f.section || 'Geral')));
    
    // Filter sections based on strict requirement for Process ID '1'
    const filteredSections = sections.filter(section => {
      if (definition.processId !== '1') return true;
      
      const tipo = formData.tipoRequisicao;
      if (section === 'Reposição') return tipo === 'reposicao';
      if (section === 'Transformação') return tipo === 'transformacao';
      return true;
    });
    
    return (
      <div className="space-y-8">
        {filteredSections.map(section => {
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
