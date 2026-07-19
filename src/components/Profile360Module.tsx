import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Building, Briefcase, Calendar, Clock, DollarSign, 
  FileText, Shield, Users, Heart, Palmtree, TrendingUp, GraduationCap, 
  Search, Plus, MoreHorizontal, ExternalLink, Download, AlertCircle, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Employee, RHRequest, EmployeeDocument, OccupationalExam, Dependent, Benefit, VacationRecord, EmployeeMovement, EmployeeTraining, AuditLog } from '../types';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Misc';
import { useAppConfig } from '../contexts/AppConfigContext';
import { useToast } from './ToastContext';

interface Profile360ModuleProps {
  employeeId?: string;
}

export default function Profile360Module({ employeeId }: Profile360ModuleProps) {
  const { config, updateConfig } = useAppConfig();
  const { addToast } = useToast();
  const [selectedId, setSelectedId] = useState<string | null>(employeeId || config.usuarioAtual.id);
  const [activeTab, setActiveTab] = useState('resumo');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  // Sync with prop
  useEffect(() => {
    if (employeeId) setSelectedId(employeeId);
  }, [employeeId]);

  const employee = config.colaboradores.find(e => e.id === selectedId) || config.colaboradores[0];
  const isSelf = employee.id === config.usuarioAtual.id;
  const canSwitch = config.usuarioAtual.role === 'Admin' || config.usuarioAtual.role === 'RH' || config.usuarioAtual.role === 'Diretor';

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
    { id: 'cargosalario', label: 'Cargo e Salário', icon: <DollarSign size={16} /> },
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

  const filteredSearchEmployees = config.colaboradores.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.registration.includes(searchTerm)
  );

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
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">Anexar</Button>
              <Button variant="ghost" size="icon" className="border border-gray-100"><MoreHorizontal size={18} /></Button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="mt-8 border-t border-gray-100 -mx-6 px-6 overflow-x-auto">
          <div className="flex gap-6 pt-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 text-[13px] font-bold border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id 
                    ? 'border-orange-500 text-orange-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
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
      case 'resumo': return <SummaryTab employee={employee} config={config} />;
      case 'onboarding': return <OnboardingTab employee={employee} config={config} />;
      case 'pessoais': return <PersonalTab employee={employee} />;
      case 'profissionais': return <ProfessionalTab employee={employee} />;
      case 'documentos': return <DocumentsTab employee={employee} />;
      case 'exames': return <ExamsTab employee={employee} />;
      case 'dependentes': return <DependentsTab employee={employee} />;
      case 'beneficios': return <BenefitsTab employee={employee} />;
      case 'ferias': return <VacationTab employee={employee} />;
      case 'cargosalario': return <SalaryTab employee={employee} />;
      case 'movimentacoes': return <MovementsTab employee={employee} />;
      case 'treinamentos': return <TrainingsTab employee={employee} />;
      case 'solicitacoes': return <RequestsTab employee={employee} config={config} onNavigate={updateConfig} />;
      case 'auditoria': return <AuditTab employee={employee} />;
      case 'desligamento': return <TerminationTab employee={employee} />;
      default: return null;
    }
  }
}

// Sub-components for Tabs

function SummaryTab({ employee, config }: { employee: Employee, config: any }) {
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
          <Table 
            columns={[
              { header: 'NÚMERO', accessor: 'numero', render: (val) => <span className="text-[12px] font-mono font-bold text-orange-600">{val}</span> },
              { header: 'PROCESSO', accessor: 'tipoProcesso', render: (val) => <span className="text-[12px] font-medium">{config.processos.find((p: any) => p.id === val)?.name}</span> },
              { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluída' ? 'green' : 'blue'}>{val}</Badge> },
              { header: 'DATA', accessor: 'createdAt', render: (val) => <span className="text-[12px] text-gray-500">{new Date(val).toLocaleDateString('pt-BR')}</span> }
            ]}
            data={requests}
          />
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
              <span className="text-[12px] font-bold text-gray-700">{employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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

function ProfessionalTab({ employee }: { employee: Employee }) {
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
            <InfoBlock label="Salário Base" value={employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
            <InfoBlock label="Último Reajuste" value="01/05/2024" />
            <InfoBlock label="Escala / Jornada" value="220h Mensais" />
            <InfoBlock label="Horário" value="08:00 às 18:00" />
          </div>
        </div>
      </div>
    </Card>
  );
}

function DocumentsTab({ employee }: { employee: Employee }) {
  const allDocs: EmployeeDocument[] = employee.documents || [];
  
  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
        <h3 className="text-[13px] font-bold text-gray-900">Arquivo de Documentos</h3>
        <Button size="sm" variant="outline" leftIcon={<Download size={14} />}>Baixar Tudo</Button>
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
          { header: 'ANEXO', accessor: 'id', render: () => <Button variant="ghost" size="sm" className="text-orange-600 hover:text-orange-700 p-0 h-auto"><Download size={14} /></Button> },
          { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
        ]}
        data={allDocs}
      />
    </Card>
  );
}

function ExamsTab({ employee }: { employee: Employee }) {
  const exams: OccupationalExam[] = employee.occupationalExams || [];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 border-l-4 border-green-500">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="text-green-500" size={20} />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">ASO Atual</p>
              <p className="text-sm font-bold text-gray-900">Válido até 10/05/2025</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-amber-500" size={20} />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Próximo Exame</p>
              <p className="text-sm font-bold text-gray-900">Agendar para Mar/2025</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-l-4 border-blue-500">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" size={20} />
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase">Clínica Referência</p>
              <p className="text-sm font-bold text-gray-900">MedWork Saúde Ocupacional</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <Table 
          columns={[
            { header: 'TIPO DE EXAME', accessor: 'type', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
            { header: 'REALIZAÇÃO', accessor: 'date', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'VALIDADE', accessor: 'expiryDate', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'CLÍNICA', accessor: 'clinic', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
            { header: 'STATUS', accessor: 'status', render: (val) => (
              <Badge variant={val === 'Válido' ? 'green' : 'red'}>{val}</Badge>
            )},
            { header: 'ANEXO', accessor: 'id', render: () => <Button variant="ghost" size="sm" className="text-orange-600 p-0 h-auto"><Download size={14} /></Button> },
            { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
          ]}
          data={exams}
        />
      </Card>
    </div>
  );
}

function DependentsTab({ employee }: { employee: Employee }) {
  const deps: Dependent[] = employee.dependents || [];
  
  return (
    <Card className="overflow-hidden">
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
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'red'}>{val || 'Ativo'}</Badge> },
          { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
        ]}
        data={deps}
      />
    </Card>
  );
}

function BenefitsTab({ employee }: { employee: Employee }) {
  const benefits: Benefit[] = employee.benefits || [];
  
  return (
    <Card className="overflow-hidden">
      <Table 
        columns={[
          { header: 'BENEFÍCIO', accessor: 'name', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'ADESÃO', accessor: 'enrollmentDate', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Ativo' ? 'green' : 'red'}>{val}</Badge> },
          { header: 'DEPENDENTES VINCULADOS', accessor: 'linkedDependents', render: (val) => (
            <span className="text-[12px] text-gray-600 font-medium">{(val || []).length} dependente(s)</span>
          )},
          { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
        ]}
        data={benefits}
      />
    </Card>
  );
}

function VacationTab({ employee }: { employee: Employee }) {
  const { addToast } = useToast();
  const records: VacationRecord[] = employee.vacationRecords || [];
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-orange-50/30 border border-orange-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Direito (Dias)</p>
          <p className="text-2xl font-bold text-orange-600">30</p>
        </Card>
        <Card className="p-4 bg-green-50/30 border border-green-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Gozados</p>
          <p className="text-2xl font-bold text-green-600">{records[0]?.daysTaken || 0}</p>
        </Card>
        <Card className="p-4 bg-blue-50/30 border border-blue-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Saldo Atual</p>
          <p className="text-2xl font-bold text-blue-600">{records[0]?.balance || 0}</p>
        </Card>
        <Card className="p-4 bg-gray-50 border border-gray-100">
          <p className="text-[11px] font-bold text-gray-400 uppercase mb-1">Vencimento em</p>
          <p className="text-sm font-bold text-gray-900">10/05/2025</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-[14px] font-bold text-gray-900 mb-4">Férias Programadas</h3>
        {records[0]?.scheduledVacation ? (
          <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
              <Palmtree size={24} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900">Período: {records[0].scheduledVacation}</p>
              <p className="text-[12px] text-gray-500">Duração: Calculado (Aguardando processamento)</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Badge variant="blue">Agendado</Badge>
              <Button variant="outline" size="sm" className="h-8 text-[11px] font-bold" onClick={() => addToast('Gerando Aviso de Férias (Mock)...', 'info')}>
                <Download size={14} className="mr-1" /> Aviso
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-gray-400 italic">Nenhuma programação futura.</p>
        )}
      </Card>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100">
          <h3 className="text-[13px] font-bold text-gray-900">Histórico de Concessões</h3>
        </div>
        <Table 
          columns={[
            { header: 'PERÍODO AQUISITIVO', accessor: 'period', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
            { header: 'DIAS GOZADOS', accessor: 'days', render: (val) => <span className="text-[13px] text-gray-600">{val} dias</span> },
            { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant="green">{val}</Badge> },
            { header: 'DATA DO GOZO', accessor: 'date', render: () => <span className="text-[12px] text-gray-500">01/01/2024 - 30/01/2024</span> },
            { header: 'AÇÕES', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
          ]}
          data={records[0]?.history || []}
        />
      </Card>
    </div>
  );
}

function MovementsTab({ employee }: { employee: Employee }) {
  const movs: EmployeeMovement[] = employee.movements || [];
  
  return (
    <Card className="overflow-hidden">
      <Table 
        columns={[
          { header: 'DATA', accessor: 'date', render: (val) => <span className="text-[13px] font-medium text-gray-700">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'TIPO', accessor: 'type', render: (val) => <Badge variant="blue">{val}</Badge> },
          { header: 'CARGO ANTERIOR', accessor: 'previousRole', render: (val) => <span className="text-[13px] text-gray-500">{val}</span> },
          { header: 'NOVO CARGO', accessor: 'newRole', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'SALÁRIO ANTERIOR', accessor: 'previousSalary', render: (val) => <span className="text-[13px] text-gray-500">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
          { header: 'NOVO SALÁRIO', accessor: 'newSalary', render: (val) => <span className="text-[13px] font-bold text-green-600">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
          { header: 'SOLICITAÇÃO', accessor: 'requestId', render: () => <span className="text-[12px] text-orange-600 font-mono font-bold">RH-2024-0012</span> },
          { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><ExternalLink size={14} /></Button> }
        ]}
        data={movs}
      />
    </Card>
  );
}

function TrainingsTab({ employee }: { employee: Employee }) {
  const trainings: EmployeeTraining[] = employee.trainings || [];
  
  return (
    <Card className="overflow-hidden">
      <Table 
        columns={[
          { header: 'CURSO / CAPACITAÇÃO', accessor: 'course', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'CARGA HORÁRIA', accessor: 'hours', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
          { header: 'DATA', accessor: 'date', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluído' ? 'green' : 'blue'}>{val}</Badge> },
          { header: 'CERTIFICADO', accessor: 'certificateUrl', render: () => <Button variant="ghost" size="sm" className="text-orange-600 flex items-center gap-1 p-0 h-auto"><Download size={14} /> Baixar</Button> },
          { header: '', accessor: 'id', render: () => <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal size={14} /></Button> }
        ]}
        data={trainings}
      />
    </Card>
  );
}

function RequestsTab({ employee, config, onNavigate }: { employee: Employee, config: any, onNavigate: any }) {
  const requests = config.solicitacoes.filter((r: RHRequest) => r.solicitante === employee.name || r.alvo === employee.name);
  
  return (
    <Card className="overflow-hidden">
      <Table 
        columns={[
          { header: 'NÚMERO', accessor: 'numero', render: (val) => <span className="text-[13px] font-mono font-bold text-orange-600">{val}</span> },
          { header: 'PROCESSO', accessor: 'tipoProcesso', render: (val) => <span className="text-[13px] font-medium text-gray-700">{config.processos.find((p: any) => p.id === val)?.name}</span> },
          { header: 'ALVO', accessor: 'alvo', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
          { header: 'STATUS', accessor: 'status', render: (val) => <Badge variant={val === 'Concluída' ? 'green' : val === 'Cancelada' ? 'red' : 'blue'}>{val}</Badge> },
          { header: 'ETAPA ATUAL', accessor: 'etapaAtual', render: (val) => <span className="text-[12px] text-gray-500 font-medium">{val}</span> },
          { header: 'DATA', accessor: 'createdAt', render: (val) => <span className="text-[13px] text-gray-500">{new Date(val).toLocaleDateString('pt-BR')}</span> },
          { header: '', accessor: 'id', render: (val) => <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onNavigate({ currentRequestId: val })}><ExternalLink size={14} /></Button> }
        ]}
        data={requests}
      />
    </Card>
  );
}

function AuditTab({ employee }: { employee: Employee }) {
  const logs: AuditLog[] = employee.auditLogs || [];
  
  return (
    <Card className="overflow-hidden">
      <Table 
        columns={[
          { header: 'DATA / HORA', accessor: 'timestamp', render: (val) => <span className="text-[13px] text-gray-600">{new Date(val).toLocaleString('pt-BR')}</span> },
          { header: 'USUÁRIO', accessor: 'user', render: (val) => <span className="text-[13px] font-bold text-gray-700">{val}</span> },
          { header: 'AÇÃO', accessor: 'action', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
          { header: 'CAMPO', accessor: 'field', render: (val) => <span className="text-[13px] text-gray-500">{val || '-'}</span> },
          { header: 'VALOR ANTERIOR', accessor: 'oldValue', render: (val) => <span className="text-[12px] text-red-500 line-through">{val ? String(val) : '-'}</span> },
          { header: 'VALOR NOVO', accessor: 'newValue', render: (val) => <span className="text-[12px] text-green-600 font-bold">{val ? String(val) : '-'}</span> },
          { header: 'ORIGEM', accessor: 'origin', render: (val) => <span className="text-[11px] font-bold text-gray-400 uppercase">{val || 'SISTEMA'}</span> },
          { header: 'SOLICITAÇÃO', accessor: 'requestId', render: () => <span className="text-[12px] text-orange-600 font-mono font-bold">-</span> }
        ]}
        data={logs}
      />
    </Card>
  );
}

function SalaryTab({ employee }: { employee: Employee }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Salário Atual</p>
          <p className="text-2xl font-black text-gray-900">{employee.salary.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <div className="mt-4 flex items-center gap-2 text-green-600 text-[12px] font-bold">
            <TrendingUp size={14} /> +8.5% desde a última revisão
          </div>
        </Card>
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Cargo / Classe</p>
          <p className="text-xl font-black text-gray-900">{employee.role}</p>
          <p className="text-[12px] text-gray-500 font-medium">Classe C3 • Grade 12</p>
        </Card>
        <Card className="p-6">
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Próxima Elegibilidade</p>
          <p className="text-xl font-black text-blue-600">MAIO/2025</p>
          <p className="text-[12px] text-gray-500 font-medium">Ciclo de Meritocracia Anual</p>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-[13px] font-bold text-gray-900">Evolução Salarial</h3>
          <Button size="sm" variant="ghost" leftIcon={<ExternalLink size={14} />}>Ver Política</Button>
        </div>
        <Table 
          columns={[
            { header: 'DATA VIGÊNCIA', accessor: 'date', render: (val) => <span className="text-[13px] font-medium text-gray-700">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'CARGO', accessor: 'newRole', render: (val) => <span className="text-[13px] text-gray-600">{val}</span> },
            { header: 'MOTIVO', accessor: 'type', render: (val) => <Badge variant="gray">{val}</Badge> },
            { header: 'VALOR ANTERIOR', accessor: 'previousSalary', render: (val) => <span className="text-[13px] text-gray-400 line-through">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
            { header: 'NOVO VALOR', accessor: 'newSalary', render: (val) => <span className="text-[13px] font-bold text-gray-900">{val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> },
            { header: 'AUMENTO %', accessor: 'id', render: (_, row) => {
              const diff = ((row.newSalary / row.previousSalary) - 1) * 100;
              return <span className="text-[12px] font-bold text-green-600">+{diff.toFixed(1)}%</span>;
            }}
          ]}
          data={employee.movements?.filter(m => m.newSalary > m.previousSalary) || []}
        />
      </Card>
    </div>
  );
}

function TerminationTab({ employee }: { employee: Employee }) {
  if (employee.status === 'Desligado') {
    return (
      <Card className="p-8 border-l-4 border-red-500 bg-red-50/10">
        <div className="flex items-start gap-4">
           <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
             <AlertCircle size={24} />
           </div>
           <div className="space-y-4 flex-1">
              <div>
                <h3 className="text-lg font-black text-gray-900">Histórico de Desligamento</h3>
                <p className="text-sm text-gray-500">Este colaborador foi desligado em 12/07/2026.</p>
              </div>
              <div className="grid grid-cols-2 gap-6 pt-4 border-t border-red-100">
                 <InfoBlock label="Tipo de Desligamento" value="Pedido de Demissão" />
                 <InfoBlock label="Aviso Prévio" value="Trabalhado" />
                 <InfoBlock label="Motivo" value="Proposta Externa" />
                 <InfoBlock label="Elegível para Recontratação" value="Sim" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" leftIcon={<Download size={14} />}>TRCT</Button>
                <Button size="sm" variant="outline" leftIcon={<Download size={14} />}>Chave FGTS</Button>
              </div>
           </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-12 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
        <UserMinus size={32} />
      </div>
      <h3 className="text-lg font-bold text-gray-900">Vínculo Ativo</h3>
      <p className="text-gray-500 text-sm max-w-xs mx-auto mt-2">Não existem processos de desligamento em aberto ou concluídos para este colaborador.</p>
      <div className="mt-8 flex justify-center gap-3">
         <Button variant="outline" size="sm">Simular Rescisão</Button>
         <Button size="sm" className="bg-red-600 hover:bg-red-700">Iniciar Desligamento</Button>
      </div>
    </Card>
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

function UserMinus(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="22" x2="16" y1="11" y2="11" />
    </svg>
  );
}

function UserCircle(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="10" r="3" />
      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
    </svg>
  );
}
