import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  User, Mail, Phone, MapPin, Building, Briefcase, Calendar, Clock, DollarSign,
  FileText, Shield, Users, Heart, Palmtree, TrendingUp, GraduationCap,
  Search, Plus, MoreHorizontal, ExternalLink, Download, AlertCircle, CheckCircle2, ChevronRight,
  Paperclip, Copy, FileDown, Scale, X, UserMinus
} from 'lucide-react';
import { Employee, RHRequest, EmployeeDocument, OccupationalExam, Dependent, Benefit, VacationRecord, EmployeeMovement, EmployeeTraining, AuditLog, TipoDesligamento } from '../types';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { Avatar, EmptyState, Modal } from './ui/Misc';
import { ScrollableTabs } from './ui/ScrollableTabs';
import { Select } from './ui/Select';
import { useAppConfig } from '../contexts/AppConfigContext';
import { alcancaColaborador, colaboradoresNoEscopo, contextoDeEscopoDoConfig, podeVerRemuneracao, REMUNERACAO_OCULTA } from '../utils/escopo';
import { colaboradorDoUsuario } from '../utils/hierarquia';
import { useToast } from './ToastContext';
import { isSuperAdmin, PROCESSO_DESLIGAMENTO } from '../utils/permissions';
import { baixarTexto, montarCSV, nomeSeguro } from '../utils/download';
import {
  TIPOS_DESLIGAMENTO,
  TIPO_DESLIGAMENTO_LABELS,
  calcularVerbas,
  diasAvisoPrevio
} from '../utils/desligamento';

interface Profile360ModuleProps {
  employeeId?: string;
  /** Aba aberta na montagem — permite entrar direto em Documentos, Férias etc. */
  initialTab?: string;
}

export default function Profile360Module({ employeeId, initialTab }: Profile360ModuleProps) {
  const { config, updateConfig, anexarDocumentoColaborador } = useAppConfig();
  const { addToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(employeeId || config.usuarioAtual.id);
  const [activeTab, setActiveTab] = useState(initialTab || 'resumo');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const anexoInputRef = useRef<HTMLInputElement>(null);

  // Sync with prop
  useEffect(() => {
    if (employeeId) setSelectedId(employeeId);
  }, [employeeId]);

  // ESCOPO: a ficha só abre para quem o perfil alcança. Sem isto, o Gestor
  // (que tem a tela no menu) abria o Perfil 360 de qualquer pessoa da empresa.
  const ctxEscopo = useMemo(() => contextoDeEscopoDoConfig(config), [config]);
  const visiveis = useMemo(
    () => colaboradoresNoEscopo(config.usuarioAtual, ctxEscopo),
    [config.usuarioAtual, ctxEscopo]
  );
  const eu = colaboradorDoUsuario(config.usuarioAtual.id, config.usuariosDemo, config.colaboradores);
  const escolhido = config.colaboradores.find(e => e.id === selectedId);
  // Fora do escopo cai na própria ficha — nunca no primeiro da base.
  const employee = (escolhido && alcancaColaborador(config.usuarioAtual, escolhido, ctxEscopo) ? escolhido : undefined)
    || (eu && alcancaColaborador(config.usuarioAtual, eu, ctxEscopo) ? eu : undefined)
    || visiveis[0]
    || config.colaboradores[0];
  const podeVerSalario = podeVerRemuneracao(config.usuarioAtual, ctxEscopo);
  const isSelf = employee.id === config.usuarioAtual.id;
  const canSwitch = isSuperAdmin(config.usuarioAtual) ||
    config.usuarioAtual.role === 'Admin' || config.usuarioAtual.role === 'RH' || config.usuarioAtual.role === 'Diretor';

  const tabs = [
    { id: 'resumo', label: 'Resumo', icon: <User size={16} /> },
    { id: 'onboarding', label: 'Onboarding', icon: <CheckCircle2 size={16} /> },
    { id: 'pessoais', label: 'Dados Pessoais', icon: <User size={16} /> },
    { id: 'profissionais', label: 'Profissionais', icon: <Briefcase size={16} /> },
    { id: 'documentos', label: 'Documentos', icon: <FileText size={16} /> },
    { id: 'exames', label: 'Exames / ASO', icon: <Shield size={16} /> },
    { id: 'dependentes', label: 'Dependentes', icon: <Users size={16} /> },
    { id: 'beneficios', label: 'Benefícios', icon: <Heart size={16} /> },
    { id: 'ferias', label: 'Férias', icon: <Palmtree size={16} /> },
    // A aba de remuneração só existe para quem pode ver remuneração: deixá-la
    // visível e vazia já entrega que existe um valor ali.
    ...(podeVerSalario ? [{ id: 'cargosalario', label: 'Cargo e Salário', icon: <DollarSign size={16} /> }] : []),
    { id: 'movimentacoes', label: 'Movimentações', icon: <TrendingUp size={16} /> },
    { id: 'treinamentos', label: 'Treinamentos', icon: <GraduationCap size={16} /> },
    { id: 'solicitacoes', label: 'Solicitações', icon: <FileText size={16} /> },
    { id: 'auditoria', label: 'Auditoria', icon: <Clock size={16} /> },
    { id: 'desligamento', label: 'Desligamento', icon: <UserMinus size={16} /> },
  ];

  const calculateTenure = (admissionDate: string) => {
    const admission = new Date(admissionDate);
    const today = new Date();
    let years = today.getFullYear() - admission.getFullYear();
    let months = today.getMonth() - admission.getMonth();
    if (months < 0 || (months === 0 && today.getDate() < admission.getDate())) {
      years--;
      months += 12;
    }
    return `${years} anos e ${months} meses`;
  };

  const filteredSearchEmployees = visiveis.filter(e =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.registration.includes(searchTerm)
  );

  // --- Ações do cabeçalho -------------------------------------------------

  const handleAnexo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const arquivo = event.target.files?.[0];
    event.target.value = '';
    if (!arquivo) return;
    anexarDocumentoColaborador(employee.id, { nome: arquivo.name });
    addToast(`"${arquivo.name}" anexado aos documentos de ${employee.name}.`, 'success');
    setActiveTab('documentos');
  };

  const copiarContato = () => {
    const texto = `${employee.name}\nMatrícula: ${employee.registration}\nE-mail: ${employee.email}\nTelefone: ${employee.phone}`;
    navigator.clipboard?.writeText(texto);
    addToast('Contato copiado para a área de transferência.', 'success');
    setIsMenuOpen(false);
  };

  /** Ficha inteira em JSON — o que o app tem sobre a pessoa, sem inventar PDF. */
  const baixarFicha = () => {
    baixarTexto(
      `ficha-${nomeSeguro(employee.name)}-${employee.registration}.json`,
      JSON.stringify(employee, null, 2),
      'application/json;charset=utf-8'
    );
    addToast('Ficha do colaborador exportada em JSON.', 'success');
    setIsMenuOpen(false);
  };

  /** Abre o processo 15 já com este colaborador preenchido. */
  const iniciarDesligamento = () => {
    updateConfig({
      activeView: 'request-form',
      currentRequestId: PROCESSO_DESLIGAMENTO,
      // O zoom guarda o NOME na chave do campo e o id em `<campo>Id`; os demais
      // são os campos origin 'F' do formulário de desligamento.
      prefillSolicitacao: {
        colaboradorId: employee.name,
        colaboradorIdId: employee.id,
        cargo: employee.role,
        setor: employee.department,
        centroCusto: employee.costCenter,
        admissao: employee.admissionDate,
        gestor: employee.manager
      }
    });
    setIsMenuOpen(false);
  };

  const podeDesligar = employee.status !== 'Desligado' && employee.situacao !== 'PRE_ADMISSAO';

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-20">
      {/* Header */}
      <Card className="p-6 overflow-visible">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative">
            <Avatar name={employee.name} src={employee.avatar} size="xl" />
            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center ${
              employee.status === 'Ativo' ? 'bg-green-500' : employee.status === 'Afastado' ? 'bg-amber-500' : 'bg-red-500'
            }`}>
              {employee.status === 'Ativo' && <CheckCircle2 className="w-3 h-3 text-white" />}
            </div>
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-brand-text-primary)]">{employee.name}</h1>
              <Badge variant={employee.status === 'Ativo' ? 'green' : employee.status === 'Afastado' ? 'amber' : 'red'}>
                {employee.status}
              </Badge>
              <span className="text-[12px] font-mono font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded">
                MATRÍCULA: {employee.registration}
              </span>
            </div>
            
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <Briefcase size={14} className="text-gray-400" />
                <span className="font-bold">{employee.role}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <Building size={14} className="text-gray-400" />
                <span>{employee.department} • {employee.branch}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <MapPin size={14} className="text-gray-400" />
                <span>{employee.city}, {employee.state}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <Calendar size={14} className="text-gray-400" />
                <span>Admissão: <b>{new Date(employee.admissionDate).toLocaleDateString('pt-BR')}</b> ({calculateTenure(employee.admissionDate)})</span>
              </div>
              <div className="flex items-center gap-2 text-[13px] text-gray-600">
                <User size={14} className="text-gray-400" />
                <span>Gestor: <b>{employee.manager}</b></span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            {canSwitch && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between gap-2 border border-dashed border-gray-300"
                  onClick={() => setIsSearchVisible(!isSearchVisible)}
                >
                  <Users size={14} /> Trocar Colaborador <ChevronRight size={14} />
                </Button>
                {isSearchVisible && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 p-3 animate-in zoom-in-95 duration-200">
                    <div className="relative mb-3">
                      <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Nome ou matrícula..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[12px] outline-none"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto space-y-1">
                      {filteredSearchEmployees.map(e => (
                        <button 
                          key={e.id}
                          onClick={() => {
                            setSelectedId(e.id);
                            setIsSearchVisible(false);
                            setSearchTerm('');
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-orange-50 rounded-lg transition-colors group text-left"
                        >
                          <Avatar name={e.name} src={e.avatar} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-bold text-gray-900 truncate group-hover:text-orange-600">{e.name}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{e.registration}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 md:flex-none" onClick={() => updateConfig({ activeView: 'hr-processes' })}>Nova Solicitação</Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 md:flex-none"
                leftIcon={<Paperclip size={14} />}
                onClick={() => anexoInputRef.current?.click()}
              >
                Anexar
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Mais ações"
                  aria-expanded={isMenuOpen}
                  className="border border-gray-100"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                >
                  <MoreHorizontal size={18} />
                </Button>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-[12px] shadow-2xl z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <MenuAcao icon={<Copy size={14} />} label="Copiar contato" onClick={copiarContato} />
                      <MenuAcao icon={<FileDown size={14} />} label="Baixar ficha (JSON)" onClick={baixarFicha} />
                      <MenuAcao
                        icon={<FileText size={14} />}
                        label="Ver solicitações"
                        onClick={() => { setActiveTab('solicitacoes'); setIsMenuOpen(false); }}
                      />
                      {employee.admissaoDigital && (
                        <MenuAcao
                          icon={<CheckCircle2 size={14} />}
                          label="Abrir Admissão Digital"
                          onClick={() => { updateConfig({ activeView: 'portal-colaborador' }); setIsMenuOpen(false); }}
                        />
                      )}
                      {podeDesligar && (
                        <>
                          <div className="h-px bg-gray-100 my-1 mx-2" />
                          <MenuAcao
                            icon={<UserMinus size={14} />}
                            label="Iniciar desligamento"
                            onClick={iniciarDesligamento}
                            destaque
                          />
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Um seletor de arquivo serve o cabeçalho inteiro. */}
        <input
          ref={anexoInputRef}
          type="file"
          className="hidden"
          aria-hidden="true"
          onChange={handleAnexo}
        />

        {/* Tabs Navigation — barra nativa escondida, setas próprias (ui/ScrollableTabs) */}
        <div className="mt-8 border-t border-gray-100 -mx-6 px-6">
          <ScrollableTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} className="pt-2" />
        </div>
      </Card>

      {/* Tab Content */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {renderTabContent()}
      </div>
    </div>
  );

  function renderTabContent() {
    switch (activeTab) {
      case 'resumo': return <SummaryTab employee={employee} config={config} podeVerSalario={podeVerSalario} />;
      case 'onboarding': return <OnboardingTab employee={employee} config={config} />;
      case 'pessoais': return <PersonalTab employee={employee} />;
      case 'profissionais': return <ProfessionalTab employee={employee} podeVerSalario={podeVerSalario} />;
      case 'documentos': return <DocumentsTab employee={employee} onAnexar={() => anexoInputRef.current?.click()} />;
      case 'exames': return <ExamsTab employee={employee} />;
      case 'dependentes': return <DependentsTab employee={employee} />;
      case 'beneficios': return <BenefitsTab employee={employee} />;
      case 'ferias': return <VacationTab employee={employee} />;
      case 'cargosalario': return podeVerSalario
        ? <SalaryTab employee={employee} faixas={config.faixasSalariais} />
        : <SemPermissao />;
      case 'movimentacoes': return <MovementsTab employee={employee} />;
      case 'treinamentos': return <TrainingsTab employee={employee} />;
      case 'solicitacoes': return <RequestsTab employee={employee} config={config} onNavigate={updateConfig} />;
      case 'auditoria': return <AuditTab employee={employee} />;
      case 'desligamento': return <TerminationTab employee={employee} config={config} onIniciar={iniciarDesligamento} />;
      default: return null;
    }
  }
}

// Sub-components for Tabs

function SummaryTab({ employee, config, podeVerSalario }: { employee: Employee, config: any, podeVerSalario: boolean }) {
  const requests = config.solicitacoes.filter((r: RHRequest) => r.solicitante === employee.name || r.alvo === employee.name).slice(0, 5);
  const onboarding = config.solicitacoes.find((r: RHRequest) => r.processId === '3' && (r.alvoId === employee.id || r.alvo === employee.name));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-2 space-y-6">
        {onboarding && (
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                 <CheckCircle2 size={16} className="text-blue-500" /> Onboarding em Andamento
               </h3>
               <Badge variant="blue">{Math.round(onboarding.data?.progress || 0)}% Concluído</Badge>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-blue-500" style={{ width: `${onboarding.data?.progress || 0}%` }} />
            </div>
            <p className="mt-3 text-[12px] text-gray-500 font-medium">Faltam poucas tarefas para concluir a sua integração!</p>
          </Card>
        )}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={16} className="text-orange-500" /> Últimas Solicitações
          </h3>
          {requests.length > 0 ? (
            <Table
              columns={[
                { header: 'NÚMERO', accessor: 'numero', render: (val) => <span className="text-[12px] font-mono font-bold text-orange-600">{val}</span> },
                { header: 'PROCESSO', accessor: 'tipoProcesso', render: (val) => <span className="text-[12px] font-medium">{config.processos.find((p: any) => p.id === val)?.name}</span> },
                { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluída' ? 'green' : 'blue'}>{val}</Badge> },
                { header: 'DATA', accessor: 'createdAt', render: (val) => <span className="text-[12px] text-gray-500">{new Date(val).toLocaleDateString('pt-BR')}</span> }
              ]}
              data={requests}
            />
          ) : (
            <p className="py-8 text-center text-[13px] text-gray-400 font-medium">
              Nenhuma solicitação aberta por ou para {employee.name} até agora.
            </p>
          )}
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Palmtree size={16} className="text-blue-500" /> Saldo de Férias
            </h3>
            {employee.vacationRecords?.[0] ? (
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[12px] text-gray-500">Período: <b>{employee.vacationRecords[0].acquisitivePeriod}</b></p>
                  <p className="text-2xl font-bold text-gray-900">{employee.vacationRecords[0].balance} <span className="text-sm font-normal text-gray-400">dias</span></p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(employee.vacationRecords[0].balance / 30) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 italic">Nenhum registro de férias.</p>
            )}
          </Card>
          <Card className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-green-500" /> Saúde Ocupacional (ASO)
            </h3>
            {employee.occupationalExams?.[0] ? (
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  employee.occupationalExams[0].status === 'Válido' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                }`}>
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-[13px] font-bold text-gray-900">{employee.occupationalExams[0].type}</p>
                  <p className="text-[11px] text-gray-500">Validade: {new Date(employee.occupationalExams[0].expiryDate).toLocaleDateString('pt-BR')}</p>
                </div>
                <Badge className="ml-auto" variant={employee.occupationalExams[0].status === 'Válido' ? 'green' : 'red'}>
                  {employee.occupationalExams[0].status}
                </Badge>
              </div>
            ) : (
              <p className="text-[13px] text-gray-400 italic">Nenhum exame registrado.</p>
            )}
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Informações de Contato</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">E-mail Corporativo</p>
                <p className="text-[13px] text-gray-700 font-medium">{employee.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Telefone</p>
                <p className="text-[13px] text-gray-700 font-medium">{employee.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Endereço</p>
                <p className="text-[13px] text-gray-700 font-medium">{employee.address}</p>
                <p className="text-[13px] text-gray-700 font-medium">{employee.city} - {employee.state}</p>
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Dados da Conta</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-[12px] text-gray-500">Centro de Custo</span>
              <span className="text-[12px] font-bold text-gray-700">{employee.costCenter}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[12px] text-gray-500">Salário Atual</span>
              <span className="text-[12px] font-bold text-gray-700">
                {podeVerSalario ? employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : REMUNERACAO_OCULTA}
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OnboardingTab({ employee, config }: { employee: Employee, config: any }) {
  const onboarding = config.solicitacoes.find((r: RHRequest) => r.processId === '3' && (r.alvoId === employee.id || r.alvo === employee.name));

  if (!onboarding) {
    return (
      <Card className="p-12 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
          <CheckCircle2 size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900">Sem Onboarding Ativo</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">Este colaborador já concluiu sua integração ou não possui um processo de onboarding vinculado.</p>
      </Card>
    );
  }

  const sections = [
    { id: 'rh', label: 'RH', icon: <Users size={16} /> },
    { id: 'ti', label: 'TI', icon: <Briefcase size={16} /> },
    { id: 'facilities', label: 'Facilities', icon: <Building size={16} /> },
    { id: 'gestor', label: 'Gestor', icon: <User size={16} /> },
    { id: 'colaborador', label: 'Minhas Tarefas', icon: <Shield size={16} /> }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
           <div>
             <h3 className="text-lg font-black text-gray-900">Status da sua Integração</h3>
             <p className="text-sm text-gray-500 font-medium">Acompanhe as etapas do seu onboarding na RH360</p>
           </div>
           <div className="text-right">
             <p className="text-2xl font-black text-blue-600">{Math.round(onboarding.data?.progress || 0)}%</p>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Progresso Geral</p>
           </div>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
           <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${onboarding.data?.progress || 0}%` }} />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map(section => {
          const tasks = onboarding.data?.[section.id] || [];
          const done = tasks.filter((t: any) => t.done).length;
          const total = tasks.length;
          const pct = total > 0 ? (done / total) * 100 : 0;

          return (
            <Card key={section.id} className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400">
                     {section.icon}
                   </div>
                   <div>
                     <p className="font-bold text-gray-900">{section.label}</p>
                     <p className="text-[11px] text-gray-500 font-bold uppercase">{done}/{total} Tarefas</p>
                   </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{Math.round(pct)}%</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-700 ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
              </div>
              
              <div className="mt-4 space-y-2">
                 {tasks.slice(0, 3).map((task: any) => (
                   <div key={task.id} className="flex items-center gap-2">
                     <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${task.done ? 'bg-green-500 border-green-500' : 'border-gray-200'}`}>
                       {task.done && <CheckCircle2 size={10} className="text-white" />}
                     </div>
                     <span className={`text-[12px] font-medium ${task.done ? 'text-gray-400 line-through' : 'text-gray-600'}`}>{task.task}</span>
                   </div>
                 ))}
                 {tasks.length > 3 && <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">+ {tasks.length - 3} outras tarefas</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function PersonalTab({ employee }: { employee: Employee }) {
  return (
    <Card className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="label-caps opacity-60 border-b border-gray-100 pb-2">Identificação Pessoal</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <InfoBlock label="Nome Completo" value={employee.name} />
            <InfoBlock label="Data de Nascimento" value={new Date(employee.birthDate).toLocaleDateString('pt-BR')} />
            <InfoBlock label="CPF" value={employee.cpf} />
            <InfoBlock label="RG" value={employee.documents?.find(d => d.type === 'RG')?.number || '-'} />
            <InfoBlock label="Estado Civil" value="Casado(a)" />
            <InfoBlock label="Gênero" value="Masculino" />
            <InfoBlock label="E-mail Pessoal" value="ricardo.personal@gmail.com" />
            <InfoBlock label="Naturalidade" value="São Paulo - SP" />
          </div>
        </div>
        <div className="space-y-8">
          <h3 className="label-caps opacity-60 border-b border-gray-100 pb-2">Endereço e Contato</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <InfoBlock label="CEP" value="01310-100" />
            <InfoBlock label="Endereço" value={employee.address} />
            <InfoBlock label="Cidade" value={employee.city} />
            <InfoBlock label="Estado" value={employee.state} />
            <InfoBlock label="Telefone Fixo" value="(11) 3322-1100" />
            <InfoBlock label="Celular" value={employee.phone} />
          </div>
        </div>
      </div>
    </Card>
  );
}

function ProfessionalTab({ employee, podeVerSalario }: { employee: Employee, podeVerSalario: boolean }) {
  return (
    <Card className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <h3 className="label-caps opacity-60 border-b border-gray-100 pb-2">Dados do Vínculo</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <InfoBlock label="Empresa" value={employee.company} />
            <InfoBlock label="Filial" value={employee.branch} />
            <InfoBlock label="Departamento" value={employee.department} />
            <InfoBlock label="Cargo Atual" value={employee.role} />
            <InfoBlock label="Tipo de Contrato" value="CLT" />
            <InfoBlock label="Matrícula" value={employee.registration} />
            <InfoBlock label="Data de Admissão" value={new Date(employee.admissionDate).toLocaleDateString('pt-BR')} />
            <InfoBlock label="Data de Registro" value={new Date(employee.admissionDate).toLocaleDateString('pt-BR')} />
          </div>
        </div>
        <div className="space-y-8">
          <h3 className="label-caps opacity-60 border-b border-gray-100 pb-2">Estrutura e Remuneração</h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <InfoBlock label="Gestor Direto" value={employee.manager} />
            <InfoBlock label="Centro de Custo" value={employee.costCenter} />
            <InfoBlock label="Salário Base" value={podeVerSalario ? employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : REMUNERACAO_OCULTA} />
            <InfoBlock label="Último Reajuste" value="01/05/2024" />
            <InfoBlock label="Escala / Jornada" value="220h Mensais" />
            <InfoBlock label="Horário" value="08:00 às 18:00" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function DocumentsTab({ employee, onAnexar }: { employee: Employee; onAnexar: () => void }) {
  const { addToast } = useToast();
  const allDocs: EmployeeDocument[] = employee.documents || [];

  const baixarTudo = () => {
    const csv = montarCSV(
      ['Documento', 'Número', 'Emissão', 'Validade', 'Status', 'Origem', 'Arquivo'],
      allDocs.map(d => [d.type, d.number, d.issueDate, d.expiryDate, d.status, d.origin, d.attachmentUrl])
    );
    baixarTexto(`documentos-${nomeSeguro(employee.name)}-${employee.registration}.csv`, csv, 'text/csv;charset=utf-8');
    addToast(`Índice com ${allDocs.length} documento(s) baixado.`, 'success');
  };

  const baixarUm = (doc: EmployeeDocument) => {
    const conteudo = [
      'Documento exportado do RH360 (ambiente de demonstração).',
      'Esta é a ficha do documento — a demonstração não armazena o arquivo original.',
      '',
      `Colaborador:  ${employee.name} (matrícula ${employee.registration})`,
      `Documento:    ${doc.type}`,
      `Número:       ${doc.number}`,
      `Emissão:      ${doc.issueDate || '—'}`,
      `Validade:     ${doc.expiryDate || '—'}`,
      `Status:       ${doc.status}`,
      `Origem:       ${doc.origin}`,
      `Arquivo:      ${doc.attachmentUrl || '—'}`
    ].join('\n');
    baixarTexto(`${nomeSeguro(doc.type)}-${employee.registration}.txt`, conteudo);
  };

  if (allDocs.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={44} />}
        title="Nenhum documento anexado ainda"
        description={`A ficha de ${employee.name} ainda não tem documentos arquivados. Anexe RG, CPF, CTPS ou comprovante de residência para começar.`}
        action={<Button leftIcon={<Paperclip size={16} />} onClick={onAnexar}>Anexar documento</Button>}
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3">
        <h3 className="text-[13px] font-bold text-gray-900">Arquivo de Documentos</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" leftIcon={<Paperclip size={14} />} onClick={onAnexar}>Anexar</Button>
          <Button size="sm" variant="outline" leftIcon={<Download size={14} />} onClick={baixarTudo}>Baixar Tudo</Button>
        </div>
      </div>
      <Table
        columns={[
          { header: 'DOCUMENTO', accessor: 'type', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'NÚMERO', accessor: 'number', render: (val) => <span className="text-[13px] font-mono text-gray-600">{val}</span> },
          { header: 'EMISSÃO', accessor: 'issueDate', render: (val) => <span className="text-[13px] text-gray-600">{val ? new Date(val).toLocaleDateString('pt-BR') : '-'}</span> },
          { header: 'VALIDADE', accessor: 'expiryDate', render: (val) => <span className="text-[13px] text-gray-600">{val ? new Date(val).toLocaleDateString('pt-BR') : '-'}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => (
            <Badge variant={val === 'Válido' ? 'green' : val === 'Vencido' ? 'red' : 'amber'}>{val}</Badge>
          )},
          { header: 'ORIGEM', accessor: 'origin', render: (val) => <span className="text-[11px] font-bold text-gray-400 uppercase">{val}</span> },
          { header: 'ANEXO', accessor: 'id', render: (_, row) => (
            <Button
              variant="ghost"
              size="sm"
              title={`Baixar ficha de ${row.type}`}
              aria-label={`Baixar ficha de ${row.type}`}
              className="text-orange-600 hover:text-orange-700 p-0 h-auto"
              onClick={() => baixarUm(row)}
            >
              <Download size={14} />
            </Button>
          )}
        ]}
        data={allDocs}
      />
    </Card>
  );
}

function ExamsTab({ employee }: { employee: Employee }) {
  const exams: OccupationalExam[] = employee.occupationalExams || [];

  // Os três cartões saem do próprio histórico — antes eram datas fixas no
  // código, que contradiziam a tabela logo abaixo.
  const vigente = exams.find(e => e.status === 'Válido' || e.status === 'A vencer');
  const maisRecente = exams[0];
  const proximoExame = vigente ? new Date(vigente.expiryDate) : null;

  if (exams.length === 0) {
    return (
      <EmptyState
        icon={<Shield size={44} />}
        title="Nenhum exame ocupacional registrado"
        description={
          employee.situacao === 'PRE_ADMISSAO'
            ? 'O exame admissional é registrado quando a admissão digital for aprovada.'
            : 'Ainda não há ASO admissional, periódico ou demissional na ficha deste colaborador.'
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className={`p-4 border-l-4 ${vigente ? 'border-green-500' : 'border-red-500'}`}>
          <div className="flex items-center gap-3">
            {vigente
              ? <CheckCircle2 className="text-green-500" size={20} />
              : <AlertCircle className="text-red-500" size={20} />}
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">ASO Atual</p>
              <p className="text-sm font-bold text-gray-900">
                {vigente
                  ? `Válido até ${new Date(vigente.expiryDate).toLocaleDateString('pt-BR')}`
                  : 'Vencido — renovação pendente'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-500" size={20} />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Próximo Exame</p>
              <p className="text-sm font-bold text-gray-900">
                {proximoExame
                  ? `Agendar para ${proximoExame.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`
                  : 'Agendar imediatamente'}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" size={20} />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Clínica Referência</p>
              <p className="text-sm font-bold text-gray-900">{maisRecente?.clinic || '—'}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden" padding="none">
        <Table
          columns={[
            { header: 'TIPO DE EXAME', accessor: 'type', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
            { header: 'REALIZAÇÃO', accessor: 'date', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'VALIDADE', accessor: 'expiryDate', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'CLÍNICA', accessor: 'clinic', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
            { header: 'STATUS', accessor: 'status', render: (val) => (
              <Badge variant={val === 'Válido' ? 'green' : val === 'A vencer' ? 'amber' : 'red'}>{val}</Badge>
            )},
            { header: 'ANEXO', accessor: 'attachmentUrl', render: (val) => (
              <span className="text-[12px] text-gray-500 font-medium">{val || '—'}</span>
            )}
          ]}
          data={exams}
        />
      </Card>
    </div>
  );
}

function DependentsTab({ employee }: { employee: Employee }) {
  const { updateConfig } = useAppConfig();
  const deps: Dependent[] = employee.dependents || [];

  if (deps.length === 0) {
    return (
      <EmptyState
        icon={<Users size={44} />}
        title="Nenhum dependente cadastrado"
        description={`${employee.name} não tem dependentes vinculados. A inclusão é feita pelo processo "Gestão de Dependentes".`}
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => updateConfig({ activeView: 'hr-proc-6' })}>
            Incluir dependente
          </Button>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'NOME DO DEPENDENTE', accessor: 'name', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'PARENTESCO', accessor: 'relationship', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
          { header: 'CPF', accessor: 'cpf', render: (val) => <span className="text-[13px] font-mono text-gray-500">{val || '***.***.***-**'}</span> },
          { header: 'NASCIMENTO', accessor: 'birthDate', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'BENEFÍCIOS', accessor: 'benefits', render: (val) => (
            <div className="flex flex-wrap gap-1">
              {(val || []).map((b: string, i: number) => <Badge key={i} variant="gray" className="text-[10px]">{b}</Badge>)}
            </div>
          )},
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'red'}>{val || 'Ativo'}</Badge> }
        ]}
        data={deps}
      />
    </Card>
  );
}

function BenefitsTab({ employee }: { employee: Employee }) {
  const benefits: Benefit[] = employee.benefits || [];
  const dependentes = employee.dependents || [];

  if (benefits.length === 0) {
    return (
      <EmptyState
        icon={<Heart size={44} />}
        title="Nenhum benefício ativo"
        description={
          employee.situacao === 'PRE_ADMISSAO'
            ? 'Os benefícios são ativados quando a admissão é aprovada e o vínculo passa a valer.'
            : `${employee.name} ainda não tem adesão a plano de saúde, odontológico ou vale-benefícios.`
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'BENEFÍCIO', accessor: 'name', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'ADESÃO', accessor: 'enrollmentDate', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'red'}>{val}</Badge> },
          { header: 'DEPENDENTES VINCULADOS', accessor: 'linkedDependents', render: (val) => {
            const nomes = (val || [])
              .map((id: string) => dependentes.find(d => d.id === id)?.name)
              .filter(Boolean);
            return nomes.length > 0
              ? <span className="text-[12px] text-gray-600 font-medium">{nomes.join(', ')}</span>
              : <span className="text-[12px] text-gray-400">Somente titular</span>;
          }}
        ]}
        data={benefits}
      />
    </Card>
  );
}

function VacationTab({ employee }: { employee: Employee }) {
  const { addToast } = useToast();
  const { updateConfig } = useAppConfig();
  const records: VacationRecord[] = employee.vacationRecords || [];
  const atual = records[0];

  if (!atual) {
    return (
      <EmptyState
        icon={<Palmtree size={44} />}
        title="Sem período aquisitivo completo"
        description={`${employee.name} ainda não completou 12 meses de vínculo — o primeiro período de férias abre no aniversário de admissão.`}
      />
    );
  }

  // O período aquisitivo vence 12 meses depois de fechado (fim do concessivo).
  const fimAquisitivo = Number(atual.acquisitivePeriod.split('/')[1]);
  const admissao = new Date(employee.admissionDate);
  const vencimento = Number.isNaN(fimAquisitivo)
    ? null
    : new Date(fimAquisitivo + 1, admissao.getMonth(), admissao.getDate());

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-orange-50/30 border border-orange-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Direito (Dias)</p>
          <p className="text-2xl font-bold text-orange-600">{atual.daysEntitled}</p>
        </Card>
        <Card className="p-4 bg-green-50/30 border border-green-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Gozados</p>
          <p className="text-2xl font-bold text-green-600">{atual.daysTaken}</p>
        </Card>
        <Card className="p-4 bg-blue-50/30 border border-blue-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Saldo Atual</p>
          <p className="text-2xl font-bold text-blue-600">{atual.balance}</p>
        </Card>
        <Card className="p-4 bg-gray-50 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Vencimento em</p>
          <p className="text-sm font-bold text-gray-900">{vencimento ? vencimento.toLocaleDateString('pt-BR') : '—'}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-[14px] font-bold text-gray-900 mb-4">Férias Programadas</h3>
        {atual.scheduledVacation ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 shrink-0 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Palmtree size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900">Período: {atual.scheduledVacation}</p>
              <p className="text-[12px] text-gray-500">30 dias corridos • aviso emitido com 30 dias de antecedência</p>
            </div>
            <div className="sm:ml-auto flex items-center gap-2">
              <Badge variant="blue">Agendado</Badge>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-[11px] font-bold"
                onClick={() => {
                  baixarTexto(
                    `aviso-ferias-${nomeSeguro(employee.name)}.txt`,
                    [
                      'AVISO DE FÉRIAS — RH360 (ambiente de demonstração)',
                      '',
                      `Colaborador: ${employee.name} (matrícula ${employee.registration})`,
                      `Cargo:       ${employee.role}`,
                      `Período:     ${atual.scheduledVacation}`,
                      `Aquisitivo:  ${atual.acquisitivePeriod}`,
                      `Saldo:       ${atual.balance} dias`
                    ].join('\n')
                  );
                  addToast('Aviso de férias gerado.', 'success');
                }}
              >
                <Download size={14} className="mr-1" /> Aviso
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-[13px] text-gray-500 font-medium flex-1">
              Nenhuma programação futura. O saldo de {atual.balance} dias segue disponível para marcação.
            </p>
            <Button size="sm" variant="outline" onClick={() => updateConfig({ activeView: 'hr-proc-9' })}>
              Marcar férias
            </Button>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden" padding="none">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">Histórico de Concessões</h3>
        </div>
        {(atual.history || []).length > 0 ? (
          <Table
            columns={[
              { header: 'PERÍODO AQUISITIVO', accessor: 'period', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
              { header: 'DIAS GOZADOS', accessor: 'days', render: (val) => <span className="text-[13px] text-gray-600">{val} dias</span> },
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant="green">{val}</Badge> }
            ]}
            data={atual.history}
          />
        ) : (
          <p className="px-6 py-10 text-center text-[13px] text-gray-400 font-medium">
            Primeiro período aquisitivo em curso — ainda não há concessões anteriores.
          </p>
        )}
      </Card>
    </div>
  );
}

function MovementsTab({ employee }: { employee: Employee }) {
  const movs: EmployeeMovement[] = employee.movements || [];

  if (movs.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp size={44} />}
        title="Nenhuma movimentação registrada"
        description={`${employee.name} está no cargo e na unidade de origem desde a admissão. Promoções, méritos e transferências aparecem aqui.`}
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'DATA', accessor: 'date', render: (val) => <span className="text-[13px] font-medium text-gray-700">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'TIPO', accessor: 'type', render: (val) => <Badge variant="blue">{val}</Badge> },
          { header: 'DE', accessor: 'previousRole', render: (val, row) => (
            <span className="text-[13px] text-gray-500">{row.type === 'Transferência' ? row.from : val}</span>
          )},
          { header: 'PARA', accessor: 'newRole', render: (val, row) => (
            <span className="text-[13px] font-bold text-gray-700">{row.type === 'Transferência' ? row.to : val}</span>
          )},
          { header: 'SALÁRIO ANTERIOR', accessor: 'previousSalary', render: (val) => <span className="text-[13px] text-gray-500">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
          { header: 'NOVO SALÁRIO', accessor: 'newSalary', render: (val, row) => (
            <span className={`text-[13px] font-bold ${val > row.previousSalary ? 'text-green-600' : 'text-gray-600'}`}>
              {val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          )},
          { header: 'SOLICITAÇÃO', accessor: 'requestId', render: (val) => (
            <span className="text-[12px] text-orange-600 font-mono font-bold">{val || '—'}</span>
          )}
        ]}
        data={movs}
      />
    </Card>
  );
}

function TrainingsTab({ employee }: { employee: Employee }) {
  const trainings: EmployeeTraining[] = employee.trainings || [];
  const { updateConfig } = useAppConfig();

  const baixarCertificado = (t: EmployeeTraining) => {
    const conteudo = [
      'Certificado exportado do RH360 (ambiente de demonstração).',
      'Esta é a ficha do certificado — a demonstração não armazena o arquivo original.',
      '',
      `Colaborador:  ${employee.name} (matrícula ${employee.registration})`,
      `Curso:        ${t.course}`,
      `Carga:        ${t.hours}`,
      `Conclusão:    ${new Date(t.date).toLocaleDateString('pt-BR')}`,
      `Status:       ${t.status}`
    ].join('\n');
    baixarTexto(`certificado-${nomeSeguro(t.course)}-${employee.registration}.txt`, conteudo);
  };

  if (trainings.length === 0) {
    return (
      <EmptyState
        icon={<GraduationCap size={44} />}
        title="Nenhum treinamento registrado"
        description={`${employee.name} ainda não tem capacitações concluídas ou em andamento.`}
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => updateConfig({ activeView: 'hr-proc-14' })}>
            Solicitar treinamento
          </Button>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'CURSO / CAPACITAÇÃO', accessor: 'course', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'CARGA HORÁRIA', accessor: 'hours', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
          { header: 'DATA', accessor: 'date', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluído' ? 'green' : 'blue'}>{val}</Badge> },
          { header: 'CERTIFICADO', accessor: 'certificateUrl', render: (val, row) => val ? (
            <Button variant="ghost" size="sm" className="text-orange-600 flex items-center gap-1 p-0 h-auto" onClick={() => baixarCertificado(row)}>
              <Download size={14} /> Baixar
            </Button>
          ) : (
            <span className="text-[12px] text-gray-400">Em andamento</span>
          )}
        ]}
        data={trainings}
      />
    </Card>
  );
}

function RequestsTab({ employee, config, onNavigate }: { employee: Employee, config: any, onNavigate: any }) {
  const requests = config.solicitacoes.filter((r: RHRequest) => r.solicitante === employee.name || r.alvo === employee.name);

  if (requests.length === 0) {
    return (
      <EmptyState
        icon={<FileText size={44} />}
        title="Nenhuma solicitação vinculada"
        description={`${employee.name} não abriu nem foi alvo de nenhuma solicitação até agora.`}
        action={
          <Button leftIcon={<Plus size={16} />} onClick={() => onNavigate({ activeView: 'hr-processes' })}>
            Abrir solicitação
          </Button>
        }
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'NÚMERO', accessor: 'numero', render: (val) => <span className="text-[13px] font-mono font-bold text-orange-600">{val}</span> },
          { header: 'PROCESSO', accessor: 'tipoProcesso', render: (val) => <span className="text-[13px] font-medium text-gray-700">{config.processos.find((p: any) => p.id === val)?.name}</span> },
          { header: 'ALVO', accessor: 'alvo', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluída' ? 'green' : val === 'Cancelada' ? 'red' : 'blue'}>{val}</Badge> },
          { header: 'ETAPA ATUAL', accessor: 'etapaAtual', render: (val) => <span className="text-[12px] text-gray-500 font-medium">{val}</span> },
          { header: 'DATA', accessor: 'createdAt', render: (val) => <span className="text-[13px] text-gray-500">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: '', accessor: 'id', render: (val) => <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate({ activeView: 'request-detail', currentRequestId: val })}><ExternalLink size={14} /></Button> }
        ]}
        data={requests}
      />
    </Card>
  );
}

function AuditTab({ employee }: { employee: Employee }) {
  const logs: AuditLog[] = employee.auditLogs || [];

  if (logs.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={44} />}
        title="Nenhuma alteração registrada"
        description={`A ficha de ${employee.name} não sofreu alterações desde que foi criada.`}
      />
    );
  }

  return (
    <Card className="overflow-hidden" padding="none">
      <Table
        columns={[
          { header: 'DATA / HORA', accessor: 'timestamp', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleString('pt-BR')}</span> },
          { header: 'USUÁRIO', accessor: 'user', render: (val, row) => <span className="text-[13px] font-bold text-gray-700">{val || row.userName || 'Sistema'}</span> },
          { header: 'AÇÃO', accessor: 'action', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
          { header: 'DETALHE', accessor: 'details', render: (val) => <span className="text-[13px] text-gray-500">{val || '-'}</span> },
          { header: 'VALOR ANTERIOR', accessor: 'oldValue', render: (val) => <span className="text-[12px] text-red-500 line-through">{val ? String(val) : '-'}</span> },
          { header: 'VALOR NOVO', accessor: 'newValue', render: (val) => <span className="text-[12px] text-green-600 font-bold">{val ? String(val) : '-'}</span> },
          { header: 'ORIGEM', accessor: 'origin', render: (val) => <span className="text-[11px] font-bold text-gray-400 uppercase">{val || 'SISTEMA'}</span> },
          { header: 'SOLICITAÇÃO', accessor: 'requestId', render: (val) => <span className="text-[12px] text-orange-600 font-mono font-bold">{val || '—'}</span> }
        ]}
        data={logs}
      />
    </Card>
  );
}

function SalaryTab({ employee, faixas }: { employee: Employee; faixas: { level: string; min: number; mid: number; max: number }[] }) {
  const [politicaAberta, setPoliticaAberta] = useState(false);
  const evolucao = (employee.movements || []).filter(m => m.newSalary > m.previousSalary);
  const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Faixa em que o salário atual se encaixa — é o que dá sentido a "Ver Política".
  const faixaAtual = faixas.find(f => employee.salary >= f.min && employee.salary <= f.max);
  const ultimoAumento = evolucao[0];
  const percentualUltimo = ultimoAumento
    ? ((ultimoAumento.newSalary / ultimoAumento.previousSalary - 1) * 100).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <Modal isOpen={politicaAberta} onClose={() => setPoliticaAberta(false)} title="Política de Cargos e Salários" size="lg">
        <div className="space-y-4">
          <p className="text-[13px] text-gray-600 font-medium leading-relaxed">
            Faixas vigentes cadastradas na Central Adm. O enquadramento considera o salário
            nominal; reajustes acima do teto da faixa exigem aprovação da Diretoria.
          </p>
          <div className="rounded-[12px] border border-gray-100 overflow-hidden">
            <Table
              columns={[
                { header: 'NÍVEL', accessor: 'level', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
                { header: 'MÍNIMO', accessor: 'min', render: (val) => <span className="text-[13px] text-gray-600">{brl(val)}</span> },
                { header: 'MEDIANA', accessor: 'mid', render: (val) => <span className="text-[13px] text-gray-600">{brl(val)}</span> },
                { header: 'MÁXIMO', accessor: 'max', render: (val) => <span className="text-[13px] text-gray-600">{brl(val)}</span> },
                { header: '', accessor: 'level', render: (val) => val === faixaAtual?.level
                  ? <Badge variant="orange">Faixa atual</Badge>
                  : null
                }
              ]}
              data={faixas}
            />
          </div>
          <p className="text-[12px] text-gray-500 font-medium">
            {faixaAtual
              ? `${employee.name} está enquadrado na faixa ${faixaAtual.level}.`
              : `O salário de ${employee.name} está fora das faixas cadastradas — revisar enquadramento.`}
          </p>
        </div>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Salário Atual</p>
          <p className="text-2xl font-black text-gray-900">{brl(employee.salary)}</p>
          <div className="mt-4 flex items-center gap-2 text-[12px] font-bold text-gray-500">
            {percentualUltimo ? (
              <span className="flex items-center gap-2 text-green-600">
                <TrendingUp size={14} /> +{percentualUltimo}% desde a última revisão
              </span>
            ) : (
              'Sem reajuste registrado desde a admissão'
            )}
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cargo / Faixa</p>
          <p className="text-xl font-black text-gray-900">{employee.role}</p>
          <p className="text-[12px] text-gray-500 font-medium">
            {faixaAtual ? `Faixa ${faixaAtual.level} • mediana ${brl(faixaAtual.mid)}` : 'Fora das faixas cadastradas'}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Última Movimentação</p>
          <p className="text-xl font-black text-blue-600">
            {ultimoAumento ? new Date(ultimoAumento.date).toLocaleDateString('pt-BR') : '—'}
          </p>
          <p className="text-[12px] text-gray-500 font-medium">{ultimoAumento?.type || 'Nenhuma até agora'}</p>
        </Card>
      </div>

      <Card className="overflow-hidden" padding="none">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center gap-3">
          <h3 className="text-[13px] font-bold text-gray-900">Evolução Salarial</h3>
          <Button size="sm" variant="ghost" leftIcon={<Scale size={14} />} onClick={() => setPoliticaAberta(true)}>
            Ver Política
          </Button>
        </div>
        {evolucao.length > 0 ? (
          <Table
            columns={[
              { header: 'DATA VIGÊNCIA', accessor: 'date', render: (val) => <span className="text-[13px] font-medium text-gray-700">{new Date(val).toLocaleDateString('pt-BR')}</span> },
              { header: 'CARGO', accessor: 'newRole', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
              { header: 'MOTIVO', accessor: 'type', render: (val) => <Badge variant="gray">{val}</Badge> },
              { header: 'VALOR ANTERIOR', accessor: 'previousSalary', render: (val) => <span className="text-[13px] text-gray-400 line-through">{brl(val)}</span> },
              { header: 'NOVO VALOR', accessor: 'newSalary', render: (val) => <span className="text-[13px] font-bold text-gray-900">{brl(val)}</span> },
              { header: 'AUMENTO %', accessor: 'id', render: (_, row) => {
                const diff = ((row.newSalary / row.previousSalary) - 1) * 100;
                return <span className="text-[12px] font-bold text-green-600">+{diff.toFixed(1)}%</span>;
              }}
            ]}
            data={evolucao}
          />
        ) : (
          <p className="px-6 py-10 text-center text-[13px] text-gray-400 font-medium">
            Nenhum reajuste registrado — {employee.name} está com o salário de admissão.
          </p>
        )}
      </Card>
    </div>
  );
}

function TerminationTab({ employee, config, onIniciar }: { employee: Employee; config: any; onIniciar: () => void }) {
  const { updateConfig } = useAppConfig();
  const [simulando, setSimulando] = useState(false);

  // Desligamento real deste colaborador, se houver — é dele que saem tipo,
  // motivo, datas e documentos. Antes tudo isso era texto fixo no código.
  const desligamento: RHRequest | undefined = config.solicitacoes
    .filter((r: RHRequest) =>
      (r.tipoProcesso || r.processId) === PROCESSO_DESLIGAMENTO &&
      (r.employeeId === employee.id || r.alvo === employee.name || r.data?.colaboradorIdId === employee.id))
    .sort((a: RHRequest, b: RHRequest) => (b.updatedAt || b.createdAt).localeCompare(a.updatedAt || a.createdAt))[0];

  const encerramento = desligamento?.encerramento;
  const dados = desligamento?.data || {};
  const tipoLabel = dados.tipoDesligamento
    ? TIPO_DESLIGAMENTO_LABELS[dados.tipoDesligamento as TipoDesligamento]
    : undefined;

  if (employee.status === 'Desligado' || desligamento) {
    const dataSaida = dados.ultimoDiaTrabalhado || dados.dataPrevistaDesligamento || employee.terminationDate;
    const documentos = encerramento?.documentos.filter(d => d.anexo) || [];

    return (
      <div className="space-y-6">
        <Card className="p-8 border-l-4 border-red-500 bg-red-50/10">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div className="space-y-4 flex-1 min-w-0">
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {employee.status === 'Desligado' ? 'Histórico de Desligamento' : 'Desligamento em Andamento'}
                </h3>
                <p className="text-sm text-gray-500">
                  {desligamento
                    ? `Solicitação ${desligamento.numero} • ${desligamento.status}`
                    : 'Registro anterior à digitalização do processo.'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-red-100">
                <InfoBlock label="Tipo de Desligamento" value={tipoLabel || '—'} />
                <InfoBlock label="Aviso Prévio" value={dados.avisoPrevio || '—'} />
                <InfoBlock label="Motivo" value={dados.motivo || '—'} />
                <InfoBlock
                  label="Último dia trabalhado"
                  value={dataSaida ? new Date(dataSaida).toLocaleDateString('pt-BR') : '—'}
                />
              </div>
              {desligamento && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<ExternalLink size={14} />}
                  onClick={() => updateConfig({ activeView: 'request-detail', currentRequestId: desligamento.id })}
                >
                  Abrir solicitação
                </Button>
              )}
            </div>
          </div>
        </Card>

        {encerramento && (
          <Card className="overflow-hidden" padding="none">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
              <h3 className="text-[13px] font-bold text-gray-900">Documentos da Rescisão</h3>
            </div>
            {documentos.length > 0 ? (
              <Table
                columns={[
                  { header: 'DOCUMENTO', accessor: 'label', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
                  { header: 'ARQUIVO', accessor: 'anexo', render: (val) => <span className="text-[13px] text-gray-600">{val?.nome}</span> },
                  { header: 'ANEXADO EM', accessor: 'anexo', render: (val) => (
                    <span className="text-[13px] text-gray-600">{val ? new Date(val.enviadoEm).toLocaleDateString('pt-BR') : '—'}</span>
                  )},
                  { header: '', accessor: 'id', render: (_, row) => (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-orange-600 p-0 h-auto"
                      onClick={() => baixarTexto(
                        `${nomeSeguro(row.label)}-${employee.registration}.txt`,
                        [
                          'Documento de rescisão exportado do RH360 (demonstração).',
                          'Esta é a ficha do documento — o arquivo original não é armazenado.',
                          '',
                          `Colaborador: ${employee.name} (matrícula ${employee.registration})`,
                          `Documento:   ${row.label}`,
                          `Arquivo:     ${row.anexo?.nome}`
                        ].join('\n')
                      )}
                    >
                      <Download size={14} />
                    </Button>
                  )}
                ]}
                data={documentos}
              />
            ) : (
              <p className="px-6 py-10 text-center text-[13px] text-gray-400 font-medium">
                Nenhum documento anexado na etapa de Benefícios e Encerramento.
              </p>
            )}
          </Card>
        )}
      </div>
    );
  }

  return (
    <>
      <SimulacaoRescisao employee={employee} aberto={simulando} onFechar={() => setSimulando(false)} />
      <EmptyState
        icon={<UserMinus size={44} />}
        title="Vínculo Ativo"
        description={`Não existem processos de desligamento em aberto ou concluídos para ${employee.name}.`}
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Button variant="outline" leftIcon={<Scale size={16} />} onClick={() => setSimulando(true)}>
              Simular Rescisão
            </Button>
            <Button className="bg-red-600 hover:bg-red-700" leftIcon={<UserMinus size={16} />} onClick={onIniciar}>
              Iniciar Desligamento
            </Button>
          </div>
        }
      />
    </>
  );
}

/**
 * Simulação de rescisão: mostra, para o tipo escolhido, quais verbas seriam
 * devidas. Usa a MESMA tabela da etapa de Benefícios e Encerramento
 * (utils/desligamento) — aqui é só projeção, sem valores lançados.
 */
function SimulacaoRescisao({
  employee,
  aberto,
  onFechar
}: {
  employee: Employee;
  aberto: boolean;
  onFechar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDesligamento>('sem_justa_causa');
  const hoje = new Date().toISOString().slice(0, 10);
  const verbas = useMemo(
    () => calcularVerbas(tipo, { admissao: employee.admissionDate, termino: hoje }),
    [tipo, employee.admissionDate, hoje]
  );
  const dias = diasAvisoPrevio(employee.admissionDate, hoje);

  return (
    <Modal isOpen={aberto} onClose={onFechar} title={`Simulação de Rescisão — ${employee.name}`} size="lg">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="label-caps block">Tipo de desligamento</label>
            <Select
              value={tipo}
              onChange={v => setTipo(v as TipoDesligamento)}
              ariaLabel="Tipo de desligamento para a simulação"
              className="w-full"
              options={TIPOS_DESLIGAMENTO.map(t => ({ value: t, label: TIPO_DESLIGAMENTO_LABELS[t] }))}
            />
          </div>
          <div className="sm:text-right">
            <p className="label-caps">Aviso prévio</p>
            <p className="text-[15px] font-black text-gray-900">{dias ? `${dias} dias` : '—'}</p>
          </div>
        </div>

        <div className="space-y-2 max-h-[45vh] overflow-y-auto custom-scrollbar pr-1">
          {verbas.map(verba => (
            <div
              key={verba.id}
              className={`rounded-[12px] border px-4 py-3 flex items-start gap-3 ${
                verba.devida ? 'border-gray-100 bg-white' : 'border-gray-100 bg-gray-50/60'
              }`}
            >
              <span className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
                verba.devida ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'
              }`}>
                {verba.devida ? <CheckCircle2 size={14} /> : <X size={14} />}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[14px] font-bold ${verba.devida ? 'text-gray-900' : 'text-gray-400'}`}>
                    {verba.label}
                  </span>
                  <Badge variant={verba.devida ? 'green' : 'gray'} size="sm">
                    {verba.devida ? 'Devido' : 'Não devido'}
                  </Badge>
                </div>
                <p className="text-[12px] text-gray-500 font-medium leading-relaxed mt-0.5">{verba.detalhe}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-[12px] text-gray-500 font-medium">
          Projeção informativa: os valores em R$ são apurados pelo DP na etapa de Benefícios e
          Encerramento, conforme a convenção coletiva aplicável.
        </p>
      </div>
    </Modal>
  );
}

/** Item do menu "..." do cabeçalho. */
function MenuAcao({
  icon,
  label,
  onClick,
  destaque = false
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destaque?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors ${
        destaque ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={destaque ? 'text-red-500' : 'text-gray-400'}>{icon}</span>
      <span className="text-[13px] font-bold">{label}</span>
    </button>
  );
}

/**
 * Bloco de "você não tem acesso a isto". Diz o motivo em vez de mostrar a aba
 * vazia — quem vê precisa saber que existe dado ali e que falta permissão, não
 * concluir que a pessoa não tem histórico.
 */
function SemPermissao() {
  return (
    <EmptyState
      icon={<Shield size={40} />}
      title="Sem acesso a dados de remuneração"
      description="Salário, faixa salarial e histórico de cargo e salário são restritos a RH/DP, Diretoria e Administração. Fale com o RH se você precisa dessa visão."
    />
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-[13px] font-semibold text-gray-700">{value}</p>
    </div>
  );
}
