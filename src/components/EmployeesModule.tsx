import React, { useState, useMemo } from 'react';
import { 
  Users, Search, Plus, ChevronDown, Eye, MoreHorizontal, User as UserIcon, Building, Briefcase, MapPin, Tag, Filter, FileText, History
} from 'lucide-react';
import { Employee } from '../types';
import { Button } from './ui/Button';
import { Card, Table } from './ui/CardAndTable';
import { Badge } from './ui/Badge';
import { PageHeader } from './ui/FormAndHeader';
import { Avatar, Modal } from './ui/Misc';
import { useAppConfig } from '../contexts/AppConfigContext';

interface EmployeesModuleProps {
  onNavigate: (view: string, employeeId?: string) => void;
}

export default function EmployeesModule({ onNavigate }: EmployeesModuleProps) {
  const { config } = useAppConfig();
  const employees = config.colaboradores;

  const [searchTerm, setSearchTerm] = useState('');
  const [isNewEmployeeModalOpen, setIsNewEmployeeModalOpen] = useState(false);
  
  // Filter states
  const [filters, setFilters] = useState({
    registration: '',
    cpf: '',
    company: '',
    branch: '',
    department: '',
    role: '',
    manager: '',
    status: ''
  });

  const [isFilterVisible, setIsFilterVisible] = useState(false);

  // KPIs
  const activeCount = employees.filter(e => e.status === 'Ativo').length;
  const awayCount = employees.filter(e => e.status === 'Afastado').length;
  const preAdmitCount = employees.filter(e => e.status === 'Pré-admissão').length;
  const terminatedCount = employees.filter(e => e.status === 'Desligado').length;

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.registration.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cpf.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRegistration = !filters.registration || emp.registration.includes(filters.registration);
      const matchesCpf = !filters.cpf || emp.cpf.includes(filters.cpf);
      const matchesCompany = !filters.company || emp.company === filters.company;
      const matchesBranch = !filters.branch || emp.branch === filters.branch;
      const matchesDepartment = !filters.department || emp.department === filters.department;
      const matchesRole = !filters.role || emp.role === filters.role;
      const matchesManager = !filters.manager || emp.manager === filters.manager;
      const matchesStatus = !filters.status || emp.status === filters.status;

      return matchesSearch && matchesRegistration && matchesCpf && matchesCompany && 
             matchesBranch && matchesDepartment && matchesRole && matchesManager && matchesStatus;
    });
  }, [employees, searchTerm, filters]);

  const canCreate = config.usuarioAtual.role === 'Admin' || config.usuarioAtual.role === 'RH';

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <PageHeader 
        title="Colaboradores"
        subtitle="Consulte e gerencie as pessoas vinculadas à empresa ativa"
        actions={
          canCreate && (
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsNewEmployeeModalOpen(true)}>
              Novo colaborador
            </Button>
          )
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'ATIVOS', value: activeCount, icon: <Users size={20} />, color: 'green' },
          { label: 'AFASTADOS', value: awayCount, icon: <UserIcon size={20} />, color: 'amber' },
          { label: 'PRÉ-ADMISSÃO', value: preAdmitCount, icon: <Plus size={20} />, color: 'blue' },
          { label: 'DESLIGADOS', value: terminatedCount, icon: <UserMinus size={20} />, color: 'red' },
        ].map((kpi, i) => (
          <Card key={i} className="p-6">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-[12px] bg-${kpi.color}-50 text-${kpi.color}-600 flex items-center justify-center`}>
                {kpi.icon}
              </div>
              <div>
                <p className="label-caps opacity-60">{kpi.label}</p>
                <h3 className="text-2xl font-bold text-[var(--color-brand-text-primary)] mt-0.5 tabular-nums">{kpi.value}</h3>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters & Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-[var(--color-brand-border)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Buscar por nome, matrícula ou CPF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={isFilterVisible ? 'primary' : 'ghost'} 
                size="sm" 
                leftIcon={<Filter className="w-4 h-4" />}
                onClick={() => setIsFilterVisible(!isFilterVisible)}
              >
                {isFilterVisible ? 'Ocultar Filtros' : 'Mais Filtros'}
              </Button>
            </div>
          </div>

          {isFilterVisible && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 animate-in slide-in-from-top duration-300">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Matrícula</label>
                <input 
                  type="text" 
                  value={filters.registration}
                  onChange={(e) => setFilters({...filters, registration: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">CPF</label>
                <input 
                  type="text" 
                  value={filters.cpf}
                  onChange={(e) => setFilters({...filters, cpf: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Empresa</label>
                <select 
                  value={filters.company}
                  onChange={(e) => setFilters({...filters, company: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none"
                >
                  <option value="">Todas</option>
                  {config.empresas.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Filial</label>
                <select 
                  value={filters.branch}
                  onChange={(e) => setFilters({...filters, branch: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none"
                >
                  <option value="">Todas</option>
                  {config.filiais.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Setor</label>
                <select 
                  value={filters.department}
                  onChange={(e) => setFilters({...filters, department: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none"
                >
                  <option value="">Todos</option>
                  {config.setores.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cargo</label>
                <select 
                  value={filters.role}
                  onChange={(e) => setFilters({...filters, role: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none"
                >
                  <option value="">Todos</option>
                  {config.cargos.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Gestor</label>
                <input 
                  type="text" 
                  value={filters.manager}
                  onChange={(e) => setFilters({...filters, manager: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</label>
                <select 
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full p-2 bg-white border border-[var(--color-brand-border)] rounded-[6px] text-[12px] outline-none"
                >
                  <option value="">Todos</option>
                  <option value="Ativo">Ativo</option>
                  <option value="Afastado">Afastado</option>
                  <option value="Pré-admissão">Pré-admissão</option>
                  <option value="Desligado">Desligado</option>
                </select>
              </div>
              <div className="md:col-span-4 flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setFilters({
                  registration: '', cpf: '', company: '', branch: '', department: '', role: '', manager: '', status: ''
                })}>Limpar</Button>
              </div>
            </div>
          )}
        </div>

        <Table 
          columns={[
            { header: 'NOME', accessor: 'name', render: (val, row) => (
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('profile-360', row.id)}>
                <Avatar name={val} src={row.avatar} size="sm" />
                <div>
                  <p className="font-bold text-[13px] text-[var(--color-brand-text-primary)]">{val}</p>
                  <p className="text-[11px] text-[var(--color-brand-text-secondary)]">{row.email}</p>
                </div>
              </div>
            )},
            { header: 'MATRÍCULA', accessor: 'registration', render: (val) => <span className="text-[12px] font-mono font-medium text-gray-500">{val}</span> },
            { header: 'CARGO', accessor: 'role', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
            { header: 'SETOR', accessor: 'department', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
            { header: 'FILIAL', accessor: 'branch', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
            { header: 'GESTOR', accessor: 'manager', render: (val) => <span className="text-[13px] font-medium text-gray-700">{val}</span> },
            { header: 'ADMISSÃO', accessor: 'admissionDate', render: (val) => <span className="text-[13px] font-medium text-gray-700">{new Date(val).toLocaleDateString('pt-BR')}</span> },
            { header: 'STATUS', accessor: 'status', render: (val) => (
              <Badge variant={val === 'Ativo' ? 'green' : val === 'Afastado' ? 'amber' : val === 'Desligado' ? 'red' : 'blue'}>
                {val}
              </Badge>
            )},
            { header: '', accessor: 'actions', render: (_, row) => (
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => onNavigate('profile-360', row.id)} title="Ver Perfil 360">
                  <Eye className="w-4 h-4" />
                </Button>
                <div className="relative group/menu">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-100 rounded-lg shadow-xl py-1 z-50 invisible group-hover/menu:visible opacity-0 group-hover/menu:opacity-100 transition-all transform scale-95 group-hover/menu:scale-100">
                    <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => onNavigate('profile-360', row.id)}>
                      <UserCircle className="w-3.5 h-3.5" /> Visualizar Perfil 360
                    </button>
                    <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => onNavigate('hr-processes')}>
                      <Plus className="w-3.5 h-3.5" /> Abrir solicitação
                    </button>
                    <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => onNavigate('profile-360', row.id)}>
                      <FileText className="w-3.5 h-3.5" /> Consultar documentos
                    </button>
                    <button className="w-full text-left px-4 py-2 text-[12px] font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => onNavigate('profile-360', row.id)}>
                      <History className="w-3.5 h-3.5" /> Consultar histórico
                    </button>
                  </div>
                </div>
              </div>
            )}
          ]}
          data={filteredEmployees}
        />
      </Card>

      <Modal
        isOpen={isNewEmployeeModalOpen}
        onClose={() => setIsNewEmployeeModalOpen(false)}
        title="Novo Colaborador"
      >
        <div className="space-y-8 p-2">
          {/* Modal content simplified as requested by antirregressão rules - focus on visual structure */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="label-caps opacity-60 border-b border-gray-100 pb-2 flex items-center gap-2">
                <UserIcon className="w-4 h-4" /> Dados Básicos
              </h4>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Nome Completo</label>
                  <input type="text" className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">CPF</label>
                    <input type="text" className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Data Nasc.</label>
                    <input type="date" className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none" />
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <h4 className="label-caps opacity-60 border-b border-gray-100 pb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Profissional
              </h4>
              <div className="space-y-4">
                 <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Cargo</label>
                  <input type="text" className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Departamento</label>
                    <input type="text" className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Filial</label>
                    <select className="w-full p-2.5 bg-gray-50 border border-[var(--color-brand-border)] rounded-[8px] text-[13px] outline-none font-bold">
                      <option>Matriz SP</option>
                      <option>Filial PR</option>
                      <option>Filial RJ</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--color-brand-border)]">
            <Button variant="ghost" onClick={() => setIsNewEmployeeModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setIsNewEmployeeModalOpen(false)}>
              Salvar Colaborador
            </Button>
          </div>
        </div>
      </Modal>
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
