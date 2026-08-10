import { Employee, RHProcess, RHRequest, Group, Job, Application, Task, Announcement, BenefitConfig, Company, CostCenter, Sector, User, HistoryEntry, Accesso, TargetMode, AdmissaoBloco, DocumentoStatusRevisao } from './types';
import { criarBlocosAdmissao } from './utils/admissaoDigital';
import { ETAPA_ENCERRAMENTO } from './utils/desligamento';
import { comFichaCompleta } from './utils/fichaColaborador';
import { matriculaDoCadastro } from './utils/identidade';

/**
 * Blocos de demonstração da Admissão Digital derivados da definição canônica
 * (`criarBlocosAdmissao`), para o seed não desencostar da lista real de blocos:
 * quando um bloco novo entra, os dois pré-admitidos do seed já o recebem.
 * O padrão aqui é "tudo confirmado"; o override descreve só o que difere.
 */
const blocosDemo = (
  statusPadrao: DocumentoStatusRevisao,
  overrides: Record<string, Partial<AdmissaoBloco>>
): AdmissaoBloco[] =>
  criarBlocosAdmissao().map(bloco => ({
    ...bloco,
    statusRevisao: statusPadrao,
    confirmado: true,
    ...(overrides[bloco.id] || {})
  }));

// COMPANIES
export const COMPANIES: Company[] = [
  { id: '1', name: 'RH360 Corporate', document: '12.345.678/0001-90' },
  { id: '2', name: 'TechFlow Solutions', document: '98.765.432/0001-21' }
];

// BRANCHES
export const BRANCHES = ['Matriz SP', 'Filial PR', 'Filial Goiânia'];

// UNITS
export const UNITS: any[] = [
  { id: 'un-1', name: 'Escritório Central', branchId: 'Matriz SP' },
  { id: 'un-2', name: 'Centro de Distribuição', branchId: 'Matriz SP' },
  { id: 'un-3', name: 'Hub Tecnológico', branchId: 'Filial PR' }
];

// SALARY BANDS
export const SALARY_BANDS: any[] = [
  { level: 'JR I', min: 3500, mid: 4500, max: 5500 },
  { level: 'JR II', min: 4500, mid: 5500, max: 6500 },
  { level: 'PL I', min: 6500, mid: 7500, max: 8500 },
  { level: 'PL II', min: 8500, mid: 9500, max: 11000 },
  { level: 'SR I', min: 11000, mid: 13000, max: 15000 },
  { level: 'SR II', min: 15000, mid: 17500, max: 20000 },
  { level: 'ESP I', min: 20000, mid: 25000, max: 30000 }
];

// UNIONS
export const UNIONS: any[] = [
  { id: 'u1', name: 'SINDPD - TI', code: 'SP001' },
  { id: 'u2', name: 'Sindicato dos Comerciários', code: 'SP002' }
];

// INTRANET ITEMS
export const INITIAL_INTRANET: any[] = [
  {
    id: 'news-1',
    title: 'RH360: A Nova Era da Gestão de Pessoas',
    summary: 'Conheça as novas funcionalidades da nossa plataforma integrada.',
    content: 'Estamos felizes em anunciar o lançamento oficial do RH360...',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&q=80&w=800',
    category: 'Notícia',
    author: 'Ana Paula Lima',
    authorId: 'RH-001',
    date: '2026-07-15',
    priority: 'Importante',
    status: 'Publicado',
    target: { profiles: ['Administrador', 'Diretoria', 'RH/DP', 'Gestor', 'Colaborador'] }
  },
  {
    id: 'news-2',
    title: 'Campanha de Vacinação 2026',
    summary: 'Não perca o prazo para a vacinação anual na Matriz.',
    content: 'A vacinação ocorrerá nos dias 20 e 21 de Julho no auditório...',
    category: 'Campanha',
    author: 'RH/DP',
    authorId: 'RH-001',
    date: '2026-07-14',
    priority: 'Normal',
    status: 'Publicado',
    target: { branches: ['Matriz SP'] }
  }
];

// COST CENTERS
export const COST_CENTERS: CostCenter[] = [
  { id: '1', name: 'Tecnologia', code: 'TI-001' },
  { id: '2', name: 'Administrativo', code: 'ADM-001' },
  { id: '3', name: 'Comercial', code: 'COM-001' },
  { id: '4', name: 'Recursos Humanos', code: 'RH-001' },
  { id: '5', name: 'Financeiro', code: 'FIN-001' },
  { id: '6', name: 'Operações', code: 'OPE-001' },
  { id: '7', name: 'Marketing', code: 'MKT-001' },
  { id: '8', name: 'Jurídico', code: 'JUR-001' }
];

// SECTORS
export const SECTORS: Sector[] = [
  { id: '1', name: 'Desenvolvimento', manager: 'Marcos Vinicius', branch: 'Matriz SP' },
  { id: '2', name: 'Departamento Pessoal', manager: 'Ana Paula Lima', branch: 'Matriz SP' },
  { id: '3', name: 'Vendas', manager: 'Marcos Vinicius', branch: 'Filial PR' },
  { id: '4', name: 'Controladoria', manager: 'Ricardo Silva', branch: 'Matriz SP' },
  { id: '5', name: 'Infraestrutura', manager: 'Marcos Vinicius', branch: 'Filial Goiânia' },
  { id: '6', name: 'Recrutamento', manager: 'Ana Paula Lima', branch: 'Matriz SP' }
];

// ROLES
export const ROLES = [
  'Analista de Sistemas',
  'Gerente de TI',
  'Diretor de RH',
  'Analista de DP',
  'Coordenador Comercial',
  'Executivo de Vendas',
  'Analista Financeiro',
  'Advogado Trabalhista',
  'Analista de Marketing',
  'Assistente Administrativo',
  'Especialista em Benefícios',
  'Tech Lead'
];

// DEMO USERS
export const DEMO_USERS: User[] = [
  {
    id: 'ADMIN-GERAL-001',
    employeeId: 'EMP-029',
    name: 'Administrador Geral',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI'],
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'admin@jynx.com.br',
    password: 'Jynx123!',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'JYNX-001',
    employeeId: 'EMP-024',
    name: 'Ítalo Silva',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI', 'Jynx'],
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'italo.silva@jynx.com.br',
    password: '123',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'JYNX-002',
    employeeId: 'EMP-025',
    name: 'Jonathan Oliveira',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI', 'Jynx'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'jonathan.oliveira@jynx.com.br',
    password: '123',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'JYNX-003',
    employeeId: 'EMP-026',
    name: 'Davi Cedro',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI', 'Jynx'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'davi.cedro@jynx.com.br',
    password: '123',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'JYNX-004',
    employeeId: 'EMP-027',
    name: 'Ygor Lima',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI', 'Jynx'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'ygor.lima@jynx.com.br',
    password: '123',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'JYNX-005',
    employeeId: 'EMP-028',
    name: 'Fernanda Honorato',
    role: 'Administrador Geral',
    groups: ['Administradores', 'TI', 'Jynx'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador Geral',
    scope: 'global',
    email: 'fernanda.honorato@jynx.com.br',
    password: '123',
    canManageAccesses: true,
    status: 'Ativo'
  },
  {
    id: 'ADMIN-001',
    name: 'Administrador Demo',
    role: 'Administrador de Sistemas',
    groups: ['Administradores', 'TI', 'Diretoria', 'RH/DP', 'Gestores'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop',
    profile: 'Administrador',
    scope: 'global',
    email: 'admin@rh360.demo',
    password: '123',
    // Conta de sistema, sem ficha no cadastro (o `EMP-006` que estava aqui é a
    // Juliana Costa, que tem a própria conta em COLAB-002). Sem vínculo ela não
    // tem matrícula — e é melhor a tela mostrar "—" do que emprestar o número
    // de outra pessoa, que era o que o snapshot fazia com o '00001'.
    status: 'Ativo'
  },
  {
    id: 'DIR-002',
    name: 'Ricardo Silva',
    role: 'Diretor Geral',
    groups: ['Diretoria'],
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&h=200&fit=crop',
    profile: 'Diretoria',
    scope: 'global',
    email: 'diretoria@rh360.demo',
    password: '123',
    employeeId: 'EMP-003',
    status: 'Ativo'
  },
  {
    id: 'RH-002',
    name: 'Ana Paula Lima',
    role: 'Gerente de RH',
    groups: ['RH/DP', 'Benefícios', 'Recrutamento'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop',
    profile: 'RH/DP',
    scope: 'empresa',
    email: 'rh@rh360.demo',
    password: '123',
    employeeId: 'EMP-004',
    status: 'Ativo'
  },
  {
    id: 'GEST-002',
    name: 'Marcos Vinicius',
    role: 'Gerente de TI',
    groups: ['Gestores', 'TI'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&fit=crop',
    profile: 'Gestor',
    scope: 'equipe',
    email: 'gestor@rh360.demo',
    password: '123',
    employeeId: 'EMP-005',
    status: 'Ativo'
  },
  {
    id: 'COLAB-002',
    name: 'Juliana Costa',
    role: 'Analista de Sistemas',
    groups: ['Colaboradores'],
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&fit=crop',
    profile: 'Colaborador',
    scope: 'proprio',
    email: 'colaborador@rh360.demo',
    password: '123',
    employeeId: 'EMP-006', // Juliana Costa (o EMP-001 daqui era o Carlos Eduardo)
    status: 'Ativo'
  },
  {
    id: 'RH-001',
    name: 'Ana Paula Lima',
    role: 'Gerente de RH',
    groups: ['RH/DP', 'Benefícios', 'Recrutamento'],
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop',
    profile: 'RH/DP',
    scope: 'empresa',
    email: 'ana.paula@rh360.demo',
    password: 'RHdp123!',
    employeeId: 'EMP-004',
    status: 'Ativo'
  },
  {
    id: 'GEST-001',
    name: 'Marcos Vinicius',
    role: 'Gerente de TI',
    groups: ['Gestores', 'TI'],
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&fit=crop',
    profile: 'Gestor',
    scope: 'equipe',
    email: 'marcos.vinicius@rh360.demo',
    password: 'Gestor123!',
    employeeId: 'EMP-005',
    status: 'Ativo'
  },
  {
    id: 'COLAB-001',
    name: 'Carlos Eduardo',
    role: 'Analista de Sistemas',
    groups: ['Colaboradores'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop',
    profile: 'Colaborador',
    scope: 'proprio',
    email: 'carlos.eduardo@rh360.demo',
    password: 'Colab123!',
    employeeId: 'EMP-001',
    status: 'Ativo'
  }
];

const today = new Date();
const makeISO = (days: number) => new Date(today.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_ACCESSOS: Accesso[] = [
  {
    id: 'ACCESS-001',
    client: 'Acme Corp',
    email: 'teste.acme@jynx.com.br',
    password: 'Acme@1234',
    grantedProfile: 'Administrador',
    startDate: makeISO(-2),
    expirationDate: makeISO(20),
    createdAt: makeISO(-2),
    blocked: false
  },
  {
    id: 'ACCESS-002',
    client: 'Beta Serviços',
    email: 'teste.beta@jynx.com.br',
    password: 'Beta@1234',
    grantedProfile: 'RH/DP',
    startDate: makeISO(-8),
    expirationDate: makeISO(1),
    createdAt: makeISO(-8),
    blocked: false
  },
  {
    id: 'ACCESS-003',
    client: 'Delta Soluções',
    email: 'teste.delta@jynx.com.br',
    password: 'Delta@1234',
    grantedProfile: 'Colaborador',
    startDate: makeISO(-35),
    expirationDate: makeISO(-5),
    createdAt: makeISO(-35),
    blocked: false
  }
];

// EMPLOYEES
//
// A lista abaixo declara só o que identifica cada pessoa. Documentos, exames,
// férias, benefícios, movimentações, treinamentos e auditoria são derivados
// desses dados por `comFichaCompleta` (ver a exportação logo após o array): as
// abas do Perfil 360 nascem preenchidas e coerentes com a data de admissão de
// cada um, sem 29 blocos escritos à mão.
//
// A MATRÍCULA NÃO É DECLARADA AQUI. Ela sai do id (`matriculaDoCadastro`), e é
// por isso que o tipo é `Omit<..., 'registration'>`: enquanto era digitada, a
// numeração misturava faixas sem critério (000xx, 100xx, 200xx) e o mesmo
// número reaparecia nos snapshots das solicitações apontando para outra pessoa.
const EMPLOYEES_BASE: Omit<Employee, 'registration'>[] = [
  {
    id: 'EMP-001',
    name: 'Carlos Eduardo',
    email: 'carlos.eduardo@rh360.demo',
    phone: '(11) 98765-4321',
    address: 'Rua das Palmeiras, 123',
    city: 'São Paulo',
    state: 'SP',
    department: 'Desenvolvimento',
    role: 'Analista de Sistemas',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2022-01-10',
    birthDate: '1990-05-15',
    salary: 8500,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '123.456.789-00',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop',
    // Dependente nomeado à mão; o resto da ficha (inclusive o histórico de
    // férias, que aqui era um período sem nenhuma concessão) vem derivado.
    dependents: [
      { id: 'dep-1', name: 'Arthur Eduardo', relationship: 'Filho(a)', birthDate: '2015-08-20', cpf: '111.111.111-11', benefits: ['Plano de Saúde', 'Plano Odontológico'], status: 'Ativo' }
    ]
  },
  {
    id: 'EMP-002',
    name: 'Ana Souza',
    email: 'ana.souza@rh360.demo',
    phone: '(11) 97654-3210',
    address: 'Av. Paulista, 1000',
    city: 'São Paulo',
    state: 'SP',
    department: 'Departamento Pessoal',
    role: 'Analista de DP',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-03-20',
    birthDate: '1988-09-12',
    salary: 6200,
    managerId: 'EMP-004',
    manager: 'Ana Paula Lima',
    costCenter: 'RH-001',
    cpf: '234.567.890-11',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-003',
    name: 'Ricardo Silva',
    email: 'ricardo.silva@rh360.demo',
    phone: '(11) 96543-2109',
    address: 'Rua Amauri, 45',
    city: 'São Paulo',
    state: 'SP',
    department: 'Diretoria',
    role: 'Diretor Geral',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2015-10-01',
    birthDate: '1975-12-30',
    salary: 45000,
    managerId: 'BOARD',
    manager: 'Board',
    costCenter: 'ADM-001',
    cpf: '345.678.901-22',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=200&h=200&fit=crop',
  },
  {
    id: 'EMP-004',
    name: 'Ana Paula Lima',
    email: 'ana.paula@rh360.demo',
    phone: '(11) 95432-1098',
    address: 'Rua Itaim, 88',
    city: 'São Paulo',
    state: 'SP',
    department: 'Recursos Humanos',
    role: 'Gerente de RH',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2018-05-15',
    birthDate: '1982-04-20',
    salary: 18000,
    managerId: 'EMP-003',
    manager: 'Ricardo Silva',
    costCenter: 'RH-001',
    cpf: '456.789.012-33',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-005',
    name: 'Marcos Vinicius',
    email: 'marcos.vinicius@rh360.demo',
    phone: '(11) 94321-0987',
    address: 'Av. Brigadeiro, 2000',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Gerente de TI',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2019-08-01',
    birthDate: '1985-07-10',
    salary: 22000,
    managerId: 'EMP-003',
    manager: 'Ricardo Silva',
    costCenter: 'TI-001',
    cpf: '567.890.123-44',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&fit=crop'
  },
  // Subordinates of Marcos Vinicius
  {
    id: 'EMP-006',
    name: 'Juliana Costa',
    email: 'juliana.costa@rh360.demo',
    phone: '(11) 93210-9876',
    address: 'Rua Vergueiro, 500',
    city: 'São Paulo',
    state: 'SP',
    department: 'Desenvolvimento',
    role: 'Analista de Sistemas',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2023-02-15',
    birthDate: '1993-11-20',
    salary: 8200,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '678.901.234-55',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-007',
    name: 'Renato Oliveira',
    email: 'renato.oliveira@rh360.demo',
    phone: '(11) 92109-8765',
    address: 'Rua Augusta, 1200',
    city: 'São Paulo',
    state: 'SP',
    department: 'Infraestrutura',
    role: 'Analista de Sistemas',
    branch: 'Filial Goiânia',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2020-11-10',
    birthDate: '1987-03-25',
    salary: 7500,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '789.012.345-66',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-008',
    name: 'Fabiana Lima',
    email: 'fabiana.lima@rh360.demo',
    phone: '(11) 91098-7654',
    address: 'Rua Oscar Freire, 300',
    city: 'São Paulo',
    state: 'SP',
    department: 'Desenvolvimento',
    role: 'Analista de Sistemas',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-06-05',
    birthDate: '1991-08-30',
    salary: 9200,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '890.123.456-77',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-009',
    name: 'Bruno Meirelles',
    email: 'bruno.meirelles@rh360.demo',
    phone: '(41) 98888-7777',
    address: 'Rua Batel, 150',
    city: 'Curitiba',
    state: 'PR',
    department: 'Vendas',
    role: 'Executivo de Vendas',
    branch: 'Filial PR',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2022-09-01',
    birthDate: '1989-01-15',
    salary: 5500,
    managerId: 'EMP-019',
    manager: 'Leonardo Vinci',
    costCenter: 'COM-001',
    cpf: '901.234.567-88',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-010',
    name: 'Camila Fernandes',
    email: 'camila.fernandes@rh360.demo',
    phone: '(41) 97777-6666',
    address: 'Rua Centro, 10',
    city: 'Curitiba',
    state: 'PR',
    department: 'Vendas',
    role: 'Executivo de Vendas',
    branch: 'Filial PR',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2023-05-10',
    birthDate: '1994-06-20',
    salary: 5800,
    managerId: 'EMP-019',
    manager: 'Leonardo Vinci',
    costCenter: 'COM-001',
    cpf: '012.345.678-99',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-011',
    name: 'Daniel Rocha',
    email: 'daniel.rocha@techflow.demo',
    phone: '(11) 96666-5555',
    address: 'Rua Berrini, 5000',
    city: 'São Paulo',
    state: 'SP',
    department: 'Desenvolvimento',
    role: 'Tech Lead',
    branch: 'Matriz SP',
    company: 'TechFlow Solutions',
    status: 'Ativo',
    admissionDate: '2020-01-15',
    birthDate: '1986-10-05',
    salary: 16500,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '111.222.333-44',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-012',
    name: 'Eliana Martins',
    email: 'eliana.martins@rh360.demo',
    phone: '(11) 95555-4444',
    address: 'Rua Faria Lima, 120',
    city: 'São Paulo',
    state: 'SP',
    department: 'Recrutamento',
    role: 'Analista de RH',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-12-01',
    birthDate: '1992-02-28',
    salary: 7200,
    managerId: 'EMP-004',
    manager: 'Ana Paula Lima',
    costCenter: 'RH-001',
    cpf: '222.333.444-55',
    avatar: 'https://images.unsplash.com/photo-1554151228-14d9def656e4?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-013',
    name: 'Felipe Neves',
    email: 'felipe.neves@rh360.demo',
    phone: '(11) 94444-3333',
    address: 'Rua Consolacao, 10',
    city: 'São Paulo',
    state: 'SP',
    department: 'Financeiro',
    role: 'Analista Financeiro',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2022-04-10',
    birthDate: '1995-11-15',
    salary: 6800,
    managerId: 'EMP-018',
    manager: 'Karina Lopes',
    costCenter: 'FIN-001',
    cpf: '333.444.555-66',
    avatar: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-014',
    name: 'Giovana Santos',
    email: 'giovana.santos@rh360.demo',
    phone: '(11) 93333-2222',
    address: 'Rua Republica, 55',
    city: 'São Paulo',
    state: 'SP',
    department: 'Jurídico',
    role: 'Advogado Trabalhista',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2019-10-20',
    birthDate: '1984-05-12',
    salary: 11000,
    managerId: 'EMP-003',
    manager: 'Ricardo Silva',
    costCenter: 'JUR-001',
    cpf: '444.555.666-77',
    avatar: 'https://images.unsplash.com/photo-1598550874175-4d0fe4a2c90b?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-015',
    name: 'Helio Garcia',
    email: 'helio.garcia@rh360.demo',
    phone: '(62) 99999-8888',
    address: 'Av. Goiania, 99',
    city: 'Goiânia',
    state: 'GO',
    department: 'Operações',
    role: 'Assistente Administrativo',
    branch: 'Filial Goiânia',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2023-08-01',
    birthDate: '1998-09-30',
    salary: 3500,
    managerId: 'EMP-005',
    manager: 'Marcos Vinicius',
    costCenter: 'OPE-001',
    cpf: '555.666.777-88',
    avatar: 'https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-016',
    name: 'Isabela Rocha',
    email: 'isabela.rocha@rh360.demo',
    phone: '(11) 92222-1111',
    address: 'Rua das Flores, 45',
    city: 'São Paulo',
    state: 'SP',
    department: 'Recursos Humanos',
    role: 'Analista de RH',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-02-10',
    birthDate: '1990-12-05',
    salary: 9500,
    managerId: 'EMP-004',
    manager: 'Ana Paula Lima',
    costCenter: 'RH-001',
    cpf: '666.777.888-99',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-017',
    name: 'Jorge Amado',
    email: 'jorge.amado@techflow.demo',
    phone: '(11) 91111-0000',
    address: 'Rua Tech, 1',
    city: 'São Paulo',
    state: 'SP',
    department: 'Desenvolvimento',
    role: 'Analista de Sistemas',
    branch: 'Matriz SP',
    company: 'TechFlow Solutions',
    status: 'Ativo',
    admissionDate: '2022-11-20',
    birthDate: '1996-03-15',
    salary: 7200,
    managerId: 'EMP-011',
    manager: 'Daniel Rocha',
    costCenter: 'TI-001',
    cpf: '777.888.999-00',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-018',
    name: 'Karina Lopes',
    email: 'karina.lopes@rh360.demo',
    phone: '(11) 90000-9999',
    address: 'Rua Liberdade, 100',
    city: 'São Paulo',
    state: 'SP',
    department: 'Controladoria',
    role: 'Analista Financeiro',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2020-07-01',
    birthDate: '1987-05-18',
    salary: 8900,
    managerId: 'EMP-003',
    manager: 'Ricardo Silva',
    costCenter: 'FIN-001',
    cpf: '888.999.000-11',
    avatar: 'https://images.unsplash.com/photo-1567532939604-b6c5b0ad2e01?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-019',
    name: 'Leonardo Vinci',
    email: 'leonardo.vinci@rh360.demo',
    phone: '(41) 99999-0000',
    address: 'Rua Arte, 200',
    city: 'Curitiba',
    state: 'PR',
    department: 'Vendas',
    role: 'Coordenador Comercial',
    branch: 'Filial PR',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2019-01-10',
    birthDate: '1982-10-10',
    salary: 12500,
    managerId: 'EMP-003',
    manager: 'Ricardo Silva',
    costCenter: 'COM-001',
    cpf: '999.000.111-22',
    avatar: 'https://images.unsplash.com/photo-1463453091185-61582044d556?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-020',
    name: 'Marta Rocha',
    email: 'marta.rocha@rh360.demo',
    phone: '(11) 98888-1111',
    address: 'Av. Brasil, 50',
    city: 'São Paulo',
    state: 'SP',
    department: 'Departamento Pessoal',
    role: 'Analista de DP',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2023-08-01',
    birthDate: '1995-02-14',
    salary: 5800,
    managerId: 'EMP-004',
    manager: 'Ana Paula Lima',
    costCenter: 'RH-001',
    cpf: '000.111.222-33',
    avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-021',
    name: 'Roberto Carlos',
    email: 'roberto.carlos@rh360.demo',
    phone: '(11) 91111-2222',
    address: 'Rua da Música, 100',
    city: 'São Paulo',
    state: 'SP',
    department: 'TI',
    status: 'Inativo',
    role: 'Analista de Sistemas',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    admissionDate: '2015-01-01',
    birthDate: '1980-01-01',
    terminationDate: '2026-05-15',
    salary: 10000,
    manager: 'Marcos Vinicius',
    costCenter: 'TI-001',
    cpf: '111.111.111-11'
  },
  {
    id: 'EMP-022',
    name: 'Maria Bethânia',
    email: 'maria.bethania@rh360.demo',
    phone: '(11) 92222-3333',
    address: 'Av. das Artes, 200',
    city: 'Curitiba',
    state: 'PR',
    department: 'Vendas',
    status: 'Inativo',
    role: 'Gerente Comercial',
    branch: 'Filial PR',
    company: 'RH360 Corporate',
    admissionDate: '2018-01-01',
    birthDate: '1985-01-01',
    terminationDate: '2026-06-20',
    salary: 15000,
    manager: 'Ricardo Silva',
    costCenter: 'COM-001',
    cpf: '222.222.222-22'
  },
  {
    id: 'EMP-023',
    name: 'Caetano Veloso',
    email: 'caetano.veloso@rh360.demo',
    phone: '(11) 93333-4444',
    address: 'Largo da Ordem, 300',
    city: 'Goiânia',
    state: 'GO',
    department: 'Operações',
    status: 'Inativo',
    role: 'Diretor Operacional',
    branch: 'Filial Goiânia',
    company: 'RH360 Corporate',
    admissionDate: '2010-01-01',
    birthDate: '1970-01-01',
    terminationDate: '2026-07-01',
    salary: 30000,
    manager: 'Ricardo Silva',
    costCenter: 'OPE-001',
    cpf: '333.333.333-33'
  },

  // EQUIPE JYNX — cadastro dos usuários administradores.
  // Sem esses registros o bloco "Identificação do Solicitante" fica todo em "—",
  // porque os dados cadastrais (matrícula, setor, CC, filial) só existem em Employee.
  {
    id: 'EMP-024',
    name: 'Ítalo Silva',
    email: 'italo.silva@jynx.com.br',
    phone: '(11) 99101-0001',
    address: 'Av. Brigadeiro Faria Lima, 1500',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Diretor de Tecnologia',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2019-03-04',
    birthDate: '1987-02-11',
    salary: 32000,
    manager: 'Conselho JYNX',
    costCenter: 'TI-001',
    cpf: '801.111.111-01',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-025',
    name: 'Jonathan Oliveira',
    email: 'jonathan.oliveira@jynx.com.br',
    phone: '(11) 99101-0002',
    address: 'Rua Pamplona, 820',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Gerente de Projetos',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2020-06-15',
    birthDate: '1990-09-23',
    salary: 21000,
    managerId: 'EMP-024',
    manager: 'Ítalo Silva',
    costCenter: 'TI-001',
    cpf: '802.222.222-02',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-026',
    name: 'Davi Cedro',
    email: 'davi.cedro@jynx.com.br',
    phone: '(11) 99101-0003',
    address: 'Rua Augusta, 2200',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Analista de Sistemas Sênior',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-02-01',
    birthDate: '1993-11-05',
    salary: 14500,
    managerId: 'EMP-025',
    manager: 'Jonathan Oliveira',
    costCenter: 'TI-001',
    cpf: '803.333.333-03',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-027',
    name: 'Ygor Lima',
    email: 'ygor.lima@jynx.com.br',
    phone: '(11) 99101-0004',
    address: 'Rua Vergueiro, 410',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Analista de Suporte Técnico',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2022-08-22',
    birthDate: '1996-04-17',
    salary: 9800,
    managerId: 'EMP-025',
    manager: 'Jonathan Oliveira',
    costCenter: 'TI-001',
    cpf: '804.444.444-04',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-028',
    name: 'Fernanda Honorato',
    email: 'fernanda.honorato@jynx.com.br',
    phone: '(11) 99101-0005',
    address: 'Alameda Santos, 900',
    city: 'São Paulo',
    state: 'SP',
    department: 'Recursos Humanos',
    role: 'Analista de RH Sênior',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2021-10-11',
    birthDate: '1992-07-30',
    salary: 12500,
    managerId: 'EMP-024',
    manager: 'Ítalo Silva',
    costCenter: 'RH-001',
    cpf: '805.555.555-05',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&h=200&fit=crop'
  },
  {
    id: 'EMP-029',
    name: 'Administrador Geral',
    email: 'admin@jynx.com.br',
    phone: '(11) 99101-0000',
    address: 'Av. Brigadeiro Faria Lima, 1500',
    city: 'São Paulo',
    state: 'SP',
    department: 'Tecnologia',
    role: 'Administrador de Sistemas',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Ativo',
    admissionDate: '2019-01-02',
    birthDate: '1985-01-20',
    salary: 18000,
    managerId: 'EMP-024',
    manager: 'Ítalo Silva',
    costCenter: 'TI-001',
    cpf: '800.000.000-00',
    avatar: 'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=200&h=200&fit=crop'
  },
  // --- Admissão Digital: dados de demonstração -----------------------------
  // Dois pré-admitidos já em pontos diferentes do fluxo, para a demo começar com
  // a fila de revisão e o portal em modo correção povoados.
  {
    id: 'EMP-AD-DEMO-001',
    name: 'Juliana Prado',
    email: 'juliana.prado@rh360.demo',
    phone: '(11) 98812-4477',
    address: '',
    city: 'São Paulo',
    state: 'SP',
    // Cargo, setor, unidade e centro de custo vêm da vaga aprovada VAG-002,
    // como acontece em qualquer disparo feito pela tela.
    department: 'RH',
    role: 'Analista de RH',
    branch: 'Matriz SP',
    company: 'RH360 Corporate',
    status: 'Pré-admissão',
    situacao: 'PRE_ADMISSAO',
    admissionDate: '2026-08-10',
    birthDate: '1995-04-18',
    salary: 6200,
    manager: 'A definir',
    costCenter: '1010 - ADM',
    cpf: '901.111.111-11',
    documents: [],
    admissaoDigital: {
      estado: 'EM_ANALISE',
      disparo: {
        vagaId: 'VAG-002',
        vagaTitulo: 'Analista de RH',
        nome: 'Juliana Prado',
        cpf: '901.111.111-11',
        email: 'juliana.prado@rh360.demo',
        telefone: '(11) 98812-4477',
        salario: 6200,
        dataAdmissao: '2026-08-10',
        tipoContrato: 'CLT',
        prazoDias: 7,
        enviadoEm: '2026-07-24T13:00:00.000Z'
      },
      termoAceito: true,
      enviadoEm: '2026-07-27T18:20:00.000Z',
      // Preenchimento completo, aguardando o RH. Cobre os dois lados dos
      // condicionais: CNH e dependentes em "Sim", reservista e certificados
      // em "Não".
      blocos: blocosDemo('PENDENTE', {
        'foto-perfil': {
          anexos: [{ id: 'anx-jp-0', nome: 'foto-perfil.jpg', origem: 'Foto', enviadoEm: '2026-07-27T18:02:00.000Z' }]
        },
        'dados-pessoais': {
          dados: {
            nome: 'Juliana Prado',
            cpf: '901.111.111-11',
            dataNascimento: '1995-04-18',
            estadoCivil: 'Solteiro(a)',
            sexo: 'Feminino',
            nomeMae: 'Marta Prado'
          }
        },
        rg: {
          anexos: [
            { id: 'anx-jp-2', nome: 'rg-frente.jpg', origem: 'Foto', enviadoEm: '2026-07-27T18:08:00.000Z' },
            { id: 'anx-jp-3', nome: 'rg-verso.jpg', origem: 'Foto', enviadoEm: '2026-07-27T18:09:00.000Z' }
          ]
        },
        'titulo-eleitor': {
          dados: { numero: '0123 4567 8910' },
          anexos: [{ id: 'anx-jp-6', nome: 'titulo-eleitor.jpg', origem: 'Foto', enviadoEm: '2026-07-27T18:11:00.000Z' }]
        },
        certidao: {
          anexos: [{ id: 'anx-jp-7', nome: 'certidao-nascimento.pdf', origem: 'Arquivo', enviadoEm: '2026-07-27T18:13:00.000Z' }]
        },
        ctps: {
          anexos: [{ id: 'anx-jp-5', nome: 'ctps-digital.pdf', origem: 'Arquivo', enviadoEm: '2026-07-27T18:18:00.000Z' }]
        },
        cnh: {
          aplicavel: true,
          dados: { numero: '01234567890' },
          anexos: [{ id: 'anx-jp-8', nome: 'cnh.jpg', origem: 'Foto', enviadoEm: '2026-07-27T18:15:00.000Z' }]
        },
        reservista: { aplicavel: false },
        endereco: {
          dados: {
            cep: '01310-100',
            logradouro: 'Avenida Paulista',
            numero: '1000',
            complemento: 'Apto 82',
            bairro: 'Bela Vista',
            cidade: 'São Paulo',
            uf: 'SP'
          }
        },
        dependentes: {
          aplicavel: true,
          dependentes: [
            {
              id: 'dep-jp-1',
              name: 'Miguel Prado Alves',
              relationship: 'Filho(a)',
              birthDate: '2019-03-12',
              cpf: '903.333.333-33',
              benefits: ['Plano de Saúde']
            }
          ]
        },
        certificados: { aplicavel: false }
      })
    }
  },
  {
    id: 'EMP-AD-DEMO-002',
    name: 'Rafael Monteiro',
    email: 'rafael.monteiro@rh360.demo',
    phone: '(41) 99633-2210',
    address: '',
    city: 'Curitiba',
    state: 'PR',
    // Origem: vaga aprovada VAG-004 (Filial PR).
    department: 'TI',
    role: 'Analista de Suporte Técnico',
    branch: 'Filial PR',
    company: 'RH360 Corporate',
    status: 'Pré-admissão',
    situacao: 'PRE_ADMISSAO',
    admissionDate: '2026-08-05',
    birthDate: '1993-11-02',
    salary: 4800,
    manager: 'A definir',
    costCenter: '2020 - TI',
    cpf: '902.222.222-22',
    documents: [],
    admissaoDigital: {
      estado: 'EM_CORRECAO',
      disparo: {
        vagaId: 'VAG-004',
        vagaTitulo: 'Analista de Suporte Técnico',
        nome: 'Rafael Monteiro',
        cpf: '902.222.222-22',
        email: 'rafael.monteiro@rh360.demo',
        telefone: '(41) 99633-2210',
        salario: 4800,
        dataAdmissao: '2026-08-05',
        tipoContrato: 'CLT',
        prazoDias: 10,
        enviadoEm: '2026-07-21T12:30:00.000Z'
      },
      termoAceito: true,
      enviadoEm: '2026-07-25T15:40:00.000Z',
      mensagemRevisao: 'A foto do RG está ilegível. Reenvie frente e verso em local bem iluminado, sem reflexo e com todas as bordas visíveis.',
      // Tudo aprovado menos o RG, que voltou para correção. Espelha a Juliana
      // nos condicionais (CNH e dependentes em "Não", reservista e
      // certificados em "Sim") para a demo mostrar os dois caminhos.
      blocos: blocosDemo('APROVADO', {
        'foto-perfil': {
          anexos: [{ id: 'anx-rm-0', nome: 'foto-perfil.jpg', origem: 'Foto', enviadoEm: '2026-07-25T15:18:00.000Z' }]
        },
        'dados-pessoais': {
          dados: {
            nome: 'Rafael Monteiro',
            cpf: '902.222.222-22',
            dataNascimento: '1993-11-02',
            estadoCivil: 'Casado(a)',
            sexo: 'Masculino',
            nomeMae: 'Sandra Monteiro'
          }
        },
        rg: {
          statusRevisao: 'AGUARDANDO_CORRECAO',
          motivoRevisao: 'A foto do RG está ilegível. Reenvie frente e verso em local bem iluminado, sem reflexo e com todas as bordas visíveis.',
          confirmado: false,
          anexos: []
        },
        'titulo-eleitor': {
          dados: { numero: '9876 5432 1098' },
          anexos: [{ id: 'anx-rm-4', nome: 'titulo-eleitor.pdf', origem: 'Arquivo', enviadoEm: '2026-07-25T15:25:00.000Z' }]
        },
        // Casado(a): o bloco aparece como "Certidão de Casamento".
        certidao: {
          anexos: [{ id: 'anx-rm-5', nome: 'certidao-casamento.pdf', origem: 'Arquivo', enviadoEm: '2026-07-25T15:28:00.000Z' }]
        },
        ctps: { anexos: [] },
        cnh: { aplicavel: false },
        reservista: {
          aplicavel: true,
          dados: { numero: 'RM-88221199' },
          anexos: [{ id: 'anx-rm-6', nome: 'reservista.jpg', origem: 'Foto', enviadoEm: '2026-07-25T15:30:00.000Z' }]
        },
        endereco: {
          dados: {
            cep: '80020-320',
            logradouro: 'Rua XV de Novembro',
            numero: '250',
            complemento: '',
            bairro: 'Centro',
            cidade: 'Curitiba',
            uf: 'PR'
          }
        },
        dependentes: { aplicavel: false },
        certificados: {
          aplicavel: true,
          certificados: [
            {
              id: 'cert-rm-1',
              nome: 'Técnico em Informática',
              arquivo: 'diploma-tecnico.pdf',
              enviadoEm: '2026-07-25T15:35:00.000Z'
            }
          ]
        }
      })
    }
  }
];

/**
 * Ficha completa de cada colaborador, derivada dos próprios dados dele
 * (utils/fichaColaborador). Pré-admitidos passam intactos: sem vínculo não há
 * exame periódico, férias nem movimentação — e as abas deles mostram o estado
 * vazio, que é a informação certa.
 *
 * A matrícula entra aqui, derivada do id: `EMP-007` → `00007`. Duas pessoas só
 * colidiriam se tivessem o mesmo id, que é a chave primária do cadastro.
 */
export const INITIAL_EMPLOYEES: Employee[] = EMPLOYEES_BASE.map(emp =>
  comFichaCompleta({ ...emp, registration: matriculaDoCadastro(emp.id) })
);

/**
 * Snapshot do solicitante montado A PARTIR DO CADASTRO, pelo id do usuário.
 *
 * Nenhuma solicitação do seed digita matrícula, cargo ou setor: era assim que
 * o "Administrador Demo" saía com a matrícula do Diretor Geral e o mesmo Marcos
 * Vinicius aparecia como Gerente de TI numa tela e Gerente Comercial noutra.
 * Conta sem ficha (sistema) fica sem os campos cadastrais — que é o que ela é.
 */
const snapshotDoUsuario = (userId: string) => {
  const usuario = DEMO_USERS.find(u => u.id === userId);
  const ficha = INITIAL_EMPLOYEES.find(e => e.id === usuario?.employeeId);
  return {
    name: ficha?.name || usuario?.name || userId,
    registration: ficha?.registration,
    email: usuario?.email || ficha?.email,
    role: ficha?.role || usuario?.role,
    department: ficha?.department,
    costCenter: ficha?.costCenter,
    branch: ficha?.branch,
    avatar: ficha?.avatar || usuario?.avatar
  };
};

// Helper for default permissions
const defaultPerms = () => {
  const perms: Record<string, any> = {};
  for (let i = 1; i <= 15; i++) {
    perms[String(i)] = {
      ver: true,
      solicitar: true,
      executar: false,
      aprovar: false,
      devolver: true,
      cancelar: true,
      reabrir: false,
      verHistorico: true,
      verSigiloso: false
    };
  }
  return perms;
};

const adminPerms = () => {
  const perms: Record<string, any> = {};
  for (let i = 1; i <= 15; i++) {
    perms[String(i)] = {
      ver: true,
      solicitar: true,
      executar: true,
      aprovar: true,
      devolver: true,
      cancelar: true,
      reabrir: true,
      verHistorico: true,
      verSigiloso: true
    };
  }
  return perms;
};

const defaultSensitive = (isFull: boolean) => ({
  visualizarSalario: isFull,
  editarSalario: isFull,
  visualizarCPF: isFull,
  visualizarDocumentosPessoais: isFull,
  visualizarDadosBancarios: isFull,
  visualizarASO: isFull,
  visualizarMedidaDisciplinar: isFull,
  visualizarDesligamento: isFull,
  visualizarJuridico: isFull,
  visualizarAuditoria: isFull
});

// GROUPS
export const INITIAL_GROUPS: Group[] = [
  {
    id: 'g-admin',
    nome: 'Administradores',
    setor: 'TI',
    escopo: 'global',
    membros: ['ADMIN-001'],
    permissoes: adminPerms(),
    dadosSensiveis: defaultSensitive(true)
  },
  {
    id: 'g-diretoria',
    nome: 'Diretoria',
    setor: 'Board',
    escopo: 'global',
    membros: ['ADMIN-001', 'DIR-001'],
    permissoes: adminPerms(),
    dadosSensiveis: defaultSensitive(true)
  },
  {
    id: 'g-rh',
    nome: 'RH Corporativo',
    setor: 'RH',
    escopo: 'global',
    membros: ['ADMIN-001', 'RH-001'],
    permissoes: adminPerms(),
    dadosSensiveis: defaultSensitive(true)
  },
  {
    id: 'g-gestores',
    nome: 'Gestores',
    setor: 'Geral',
    escopo: 'equipe',
    membros: ['ADMIN-001', 'GEST-001'],
    permissoes: defaultPerms(),
    dadosSensiveis: defaultSensitive(false)
  },
  {
    id: 'g-colaboradores',
    nome: 'Colaboradores',
    setor: 'Geral',
    escopo: 'proprio',
    membros: ['COLAB-001'],
    permissoes: defaultPerms(),
    dadosSensiveis: defaultSensitive(false)
  }
];

// PROCESSES (15)
export const INITIAL_RH_PROCESSES: RHProcess[] = [
  { 
    id: '1', 
    name: 'Requisição de Vaga', 
    description: 'Abertura de novas vagas ou substituições', 
    icon: 'UserPlus', 
    pendingCount: 3, 
    ativo: true, 
    category: 'Recrutamento', 
    viewType: 'generic', 
    targetMode: TargetMode.OBJECT,
    roles: { employee: false, manager: true, hr: true, director: true }, 
    etapas: ['Abertura', 'Aprovação Gestor', 'Aprovação Diretor', 'Validado'],
    version: 1,
    isSensitive: false,
    allowDraft: true,
    allowCancel: true,
    approvals: [
      { id: 'app-1', name: 'Gestor Direto', order: 1, active: true, responsibilityType: 'gestor-direto', sla: 24, slaUnit: 'h', isMandatory: true },
      // `conditionField` precisa casar com a CHAVE do campo no formulário
      // (`id || name` de PROCESS_DEFINITIONS['1']): aqui é `salarioSugerido`.
      // Com um nome inexistente a comparação numérica lê `undefined` e o nível
      // simplesmente nunca dispara — sem erro em lugar nenhum.
      { id: 'app-2', name: 'Diretoria', order: 2, active: true, responsibilityType: 'diretoria', sla: 48, slaUnit: 'h', isMandatory: true, conditionField: 'salarioSugerido', conditionOperator: '>', conditionValue: 10000 }
    ],
    handoffs: { updateProfile: false, createRecord360: false, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'sugestao' },
    aiConfig: { enabled: false, points: [], model: 'gemini-1.5-flash', purpose: 'Triagem de perfil', requireReview: true }
  },
  { 
    id: '2', 
    name: 'Recrutamento e Seleção', 
    description: 'Gestão de candidatos e funil de seleção', 
    icon: 'Search', 
    pendingCount: 3, 
    ativo: true, 
    category: 'Recrutamento', 
    viewType: 'recruitment', 
    targetMode: TargetMode.OBJECT,
    roles: { employee: false, manager: true, hr: true, director: false }, 
    etapas: ['Triagem', 'Entrevista RH', 'Entrevista Técnica', 'Proposta'],
    version: 1,
    isSensitive: false,
    allowDraft: false,
    allowCancel: true,
    approvals: [],
    handoffs: { updateProfile: false, createRecord360: false, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'automatico', nextProcessId: '3' },
    aiConfig: { enabled: true, points: [], model: 'gemini-1.5-flash', purpose: 'Análise de currículos', requireReview: true }
  },
  // Rótulo "Admissão Digital"; o id continua '3' — rotas, permissões, handoffs e
  // processDefinitions apontam para ele.
  { id: '3', name: 'Admissão Digital', description: 'Link de admissão, documentos pelo portal e aprovação do RH', icon: 'CheckCircle2', pendingCount: 3, ativo: true, category: 'Recrutamento', viewType: 'admission', targetMode: TargetMode.CANDIDATE_ZOOM, roles: { employee: false, manager: true, hr: true, director: false }, etapas: ['Documentação', 'Exame Médico', 'Contrato', 'Finalizado'], version: 1, isSensitive: true, allowDraft: true, allowCancel: true, approvals: [], handoffs: { updateProfile: true, createRecord360: true, createTask: false, generateDoc: true, requireSignature: true, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '4', name: 'Onboarding', description: 'Checklist de integração de novos colaboradores', icon: 'Flag', pendingCount: 3, ativo: true, category: 'Recrutamento', viewType: 'onboarding', targetMode: TargetMode.EMPLOYEE_ZOOM, roles: { employee: true, manager: true, hr: true, director: false }, etapas: ['Pré-admissão', 'Primeiro Dia', 'Primeira Semana', 'Primeiro Mês'], version: 1, isSensitive: false, allowDraft: false, allowCancel: false, approvals: [], handoffs: { updateProfile: false, createRecord360: false, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'desativado' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '5', name: 'Recebimento de VR/VA', description: 'Confirmação mensal de recebimento de benefícios', icon: 'CreditCard', pendingCount: 3, ativo: true, category: 'Benefícios', viewType: 'vr-va', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: false, hr: true, director: false }, etapas: ['Crédito Lançado', 'Confirmação do Colaborador', 'Recebimento Registrado'], version: 1, isSensitive: false, allowDraft: false, allowCancel: false, approvals: [], handoffs: { updateProfile: false, createRecord360: false, createTask: false, generateDoc: true, requireSignature: true, handoffType: 'desativado' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '6', name: 'Gestão de Dependentes', description: 'Inclusão ou alteração de dependentes', icon: 'Users', pendingCount: 3, ativo: true, category: 'Benefícios', viewType: 'generic', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: false, hr: true, director: false }, etapas: ['Solicitado', 'Validação RH', 'Concluído'], version: 1, isSensitive: false, allowDraft: true, allowCancel: true, approvals: [], handoffs: { updateProfile: true, createRecord360: true, createTask: false, generateDoc: false, requireSignature: false, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '7', name: 'Alteração de Cargos e Salários', description: 'Promoções e ajustes salariais', icon: 'TrendingUp', pendingCount: 3, ativo: true, category: 'Carreira', viewType: 'generic', targetMode: TargetMode.EMPLOYEE_ZOOM, roles: { employee: false, manager: true, hr: true, director: true }, etapas: ['Solicitado', 'Análise RH', 'Aprovação Financeira', 'Aprovação Diretor', 'Concluído'], version: 1, isSensitive: true, allowDraft: true, allowCancel: true, approvals: [{ id: 'app-7-1', name: 'RH', order: 1, active: true, responsibilityType: 'rh-filial', sla: 24, slaUnit: 'h', isMandatory: true }, { id: 'app-7-2', name: 'Diretoria', order: 2, active: true, responsibilityType: 'diretoria', sla: 48, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: true, createRecord360: true, createTask: true, generateDoc: true, requireSignature: false, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '8', name: 'Prestação de Contas', description: 'Reembolso de despesas e viagens', icon: 'DollarSign', pendingCount: 3, ativo: true, category: 'Operacional', viewType: 'generic', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: true, hr: true, director: false }, etapas: ['Enviado', 'Validação Gestor', 'Audit RH', 'Pagamento'], version: 1, isSensitive: false, allowDraft: true, allowCancel: true, approvals: [{ id: 'app-8-1', name: 'Gestor', order: 1, active: true, responsibilityType: 'gestor-direto', sla: 24, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: false, createRecord360: false, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'sugestao' }, aiConfig: { enabled: true, points: [], model: 'gemini-1.5-flash', purpose: 'Auditoria de recibos', requireReview: true } },
  { id: '9', name: 'Solicitação de Férias', description: 'Agendamento de descanso anual', icon: 'Palmtree', pendingCount: 3, ativo: true, category: 'Benefícios', viewType: 'generic', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: true, hr: true, director: false }, etapas: ['Solicitado', 'Aprovação Gestor', 'Agendado'], version: 1, isSensitive: false, allowDraft: true, allowCancel: true, approvals: [{ id: 'app-9-1', name: 'Gestor', order: 1, active: true, responsibilityType: 'gestor-direto', sla: 24, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: true, createRecord360: true, createTask: false, generateDoc: false, requireSignature: false, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '10', name: 'Medida Disciplinar', description: 'Advertências, suspensões e registros disciplinares', icon: 'AlertCircle', pendingCount: 3, ativo: true, category: 'Operacional', viewType: 'generic', targetMode: TargetMode.EMPLOYEE_ZOOM, roles: { employee: false, manager: true, hr: true, director: false }, etapas: ['Registro', 'Ciência Colaborador', 'Arquivado'], version: 1, isSensitive: true, allowDraft: true, allowCancel: false, approvals: [{ id: 'app-10-1', name: 'RH', order: 1, active: true, responsibilityType: 'rh-filial', sla: 24, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: false, createRecord360: true, createTask: false, generateDoc: true, requireSignature: true, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '11', name: 'Movimentação de Pessoal', description: 'Transferências entre unidades ou departamentos', icon: 'Move', pendingCount: 3, ativo: true, category: 'Operacional', viewType: 'generic', targetMode: TargetMode.EMPLOYEE_ZOOM, roles: { employee: false, manager: true, hr: true, director: false }, etapas: ['Solicitado', 'Aprovação Origem', 'Aprovação Destino', 'Efetivado'], version: 1, isSensitive: false, allowDraft: true, allowCancel: true, approvals: [{ id: 'app-11-1', name: 'Gestor Origem', order: 1, active: true, responsibilityType: 'gestor-direto', sla: 24, slaUnit: 'h', isMandatory: true }, { id: 'app-11-2', name: 'Gestor Destino', order: 2, active: true, responsibilityType: 'gestor-setor', sla: 24, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: true, createRecord360: true, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '12', name: 'Gestão de Horas Extra', description: 'Autorização e controle de jornada extra', icon: 'Clock', pendingCount: 3, ativo: true, category: 'Operacional', viewType: 'generic', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: true, hr: true, director: false }, etapas: ['Solicitado', 'Aprovação Gestor', 'Processado'], version: 1, isSensitive: false, allowDraft: false, allowCancel: true, approvals: [{ id: 'app-12-1', name: 'Gestor', order: 1, active: true, responsibilityType: 'gestor-direto', sla: 24, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: false, createRecord360: false, createTask: true, generateDoc: false, requireSignature: false, handoffType: 'desativado' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '13', name: 'Gestão de Hierarquia', description: 'Estrutura organizacional e departamentos', icon: 'Shield', pendingCount: 3, ativo: true, category: 'Operacional', viewType: 'hierarchy', targetMode: TargetMode.EMPLOYEE_ZOOM, roles: { employee: false, manager: false, hr: true, director: true }, etapas: ['Alteração', 'Aprovação Board', 'Publicado'], version: 1, isSensitive: true, allowDraft: true, allowCancel: true, approvals: [{ id: 'app-13-1', name: 'Diretoria', order: 1, active: true, responsibilityType: 'diretoria', sla: 48, slaUnit: 'h', isMandatory: true }], handoffs: { updateProfile: false, createRecord360: false, createTask: false, generateDoc: false, requireSignature: false, handoffType: 'desativado' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { id: '14', name: 'Treinamento', description: 'Inscrição e registro de capacitações', icon: 'GraduationCap', pendingCount: 3, ativo: true, category: 'Carreira', viewType: 'generic', targetMode: TargetMode.CURRENT_USER, roles: { employee: true, manager: true, hr: true, director: false }, etapas: ['Inscrição', 'Realização', 'Certificação'], version: 1, isSensitive: false, allowDraft: true, allowCancel: true, approvals: [], handoffs: { updateProfile: false, createRecord360: true, createTask: false, generateDoc: false, requireSignature: false, handoffType: 'automatico' }, aiConfig: { enabled: false, points: [], model: '', purpose: '', requireReview: true } },
  { 
    id: '15', 
    name: 'Solicitação de Desligamento', 
    description: 'Rescisão de contrato de trabalho', 
    icon: 'UserMinus', 
    pendingCount: 3, 
    ativo: true, 
    category: 'Desligamento',
    viewType: 'generic',
    targetMode: TargetMode.EMPLOYEE_ZOOM,
    roles: { employee: false, manager: true, hr: true, director: true },
    // A rescisão não é o último passo do fluxo: depois da aprovação vem a etapa
    // de Benefícios e Encerramento (RH/DP), que é o que conclui o processo.
    etapas: ['Solicitado', 'Aprovação Diretor', ETAPA_ENCERRAMENTO, 'Conclusão'],
    version: 1, 
    isSensitive: true, 
    allowDraft: true, 
    allowCancel: false, 
    approvals: [{ id: 'app-15-1', name: 'Diretoria', order: 1, active: true, responsibilityType: 'diretoria', sla: 24, slaUnit: 'h', isMandatory: true }], 
    handoffs: { updateProfile: true, createRecord360: true, createTask: true, generateDoc: true, requireSignature: true, handoffType: 'automatico' }, 
    aiConfig: { enabled: true, points: [], model: 'gemini-1.5-flash', purpose: 'Análise de turnover', requireReview: true } 
  }
];

// REQUESTS (3 per process = 45)
export const INITIAL_RH_REQUESTS: RHRequest[] = [];

// Helper to generate history
const genHist = (req: RHRequest, steps: string[]) => {
  const h: HistoryEntry[] = [];
  const now = new Date();
  
  h.push({
    id: `h-${req.id}-1`,
    autor: req.solicitante,
    userName: req.solicitante,
    userId: req.requesterId,
    etapa: 'Abertura',
    action: 'Envio',
    de: 'Novo',
    para: steps[0],
    dataHora: new Date(now.getTime() - 48 * 3600000).toISOString(),
    timestamp: new Date(now.getTime() - 48 * 3600000).toISOString(),
    comentario: 'Início do processo.',
    comments: 'Início do processo.'
  });

  if (req.status === 'Em Análise' || req.status === 'Concluída' || req.status === 'Devolvida') {
    h.push({
      id: `h-${req.id}-2`,
      autor: steps[0].includes('Gestor') ? 'Marcos Vinicius' : 'Ana Paula Lima',
      userName: steps[0].includes('Gestor') ? 'Marcos Vinicius' : 'Ana Paula Lima',
      etapa: steps[0],
      step: steps[0],
      action: req.status === 'Devolvida' ? 'Devolução' : 'Aprovação',
      de: steps[0],
      para: steps[1] || 'Concluída',
      dataHora: new Date(now.getTime() - 24 * 3600000).toISOString(),
      timestamp: new Date(now.getTime() - 24 * 3600000).toISOString(),
      comentario: req.status === 'Devolvida' ? 'Dados incompletos, favor revisar.' : 'Aprovado conforme solicitado.',
      comments: req.status === 'Devolvida' ? 'Dados incompletos, favor revisar.' : 'Aprovado conforme solicitado.'
    });
  }

  if (req.status === 'Concluída') {
    h.push({
      id: `h-${req.id}-3`,
      autor: 'Sistema',
      userName: 'Sistema',
      etapa: steps[steps.length - 1],
      step: steps[steps.length - 1],
      action: 'Finalização',
      de: steps[steps.length - 1],
      para: 'Concluída',
      dataHora: now.toISOString(),
      timestamp: now.toISOString(),
      comentario: 'Processo finalizado com sucesso.',
      comments: 'Processo finalizado com sucesso.'
    });
  }

  return h;
};

// Helper to generate requests
const generateInitialRequests = () => {
  let counter = 1;
  // Assinatura do protocolo de VR/VA sai da ficha de quem assina, não de um
  // par nome/matrícula digitado.
  const gestorDemo = INITIAL_EMPLOYEES.find(e => e.id === 'EMP-005')!;
  INITIAL_RH_PROCESSES.forEach(p => {
    // Enhanced data based on process
    const getMockData = (pid: string) => {
      switch(pid) {
        case '1': return { tipoRequisicao: 'reposicao', empresa: 'RH360 Holding', filial: 'Matriz', quantidadeVagas: 1, dataDesejada: '2026-08-15', tipoContrato: 'CLT', modalidade: 'Híbrido', prioridade: 'Alta', justificativa: 'Substituição de colaborador que pediu desligamento.' };
        case '2': return { vagaId: 'VAC-001', cargo: 'Analista de RH', empresa: 'RH360 Holding', nomeCandidato: 'Mariana Silva', email: 'mariana.silva@email.com', telefone: '(11) 99988-7766', origem: 'LinkedIn', etapa: 'Entrevista RH', parecer: 'Candidata com excelente perfil técnico e aderência cultural.', decisao: 'Aprovado' };
        case '5': return {
          competencia: 'Março/2026',
          beneficio: 'Vale Refeição',
          valorCreditado: 850.00,
          dataCredito: '05/03/2026',
          confirmacaoRecebimento: true,
          assinatura: {
            signed: true,
            date: '2026-03-06T13:20:00.000Z',
            name: gestorDemo.name,
            registration: gestorDemo.registration
          },
          observacao: 'Crédito recebido corretamente.'
        };
        case '7': return { tipoAlteracao: 'Promoção', novoCargo: 'Coordenador Operacional', novoSalario: 9500, vigencia: '2026-09-01', justificativa: 'Destaque na liderança de projetos de automação.' };
        case '8': return { competencia: 'Fevereiro/2026', tipoDespesa: 'Hospedagem', fornecedor: 'Hotel Transamerica', data: '2026-02-15', valor: 450.00, justificativa: 'Estadia para treinamento técnico em Curitiba.' };
        case '9': return { periodoAquisitivo: '2024/2025 (30 dias)', dataInicio: '2026-12-20', diasGozo: 30, abonoPecuniario: false, adianta13: true };
        case '10': return { tipoMedida: 'Advertência Escrita', dataOcorrido: '2026-07-14', motivo: 'Ausência não justificada por dois dias consecutivos, sem comunicação prévia ao gestor.', testemunhas: 'Ana Paula Lima, Carlos Eduardo' };
        default: return { justificativa: 'Demonstração de fluxo padrão.' };
      }
    };

    // 1 Em Análise
    const req1: RHRequest = {
      id: `req-${counter}`,
      numero: `RH-2026-${String(counter).padStart(4, '0')}`,
      tipoProcesso: p.id,
      processId: p.id,
      processName: p.name,
      category: p.category,
      origem: 'manual',
      solicitante: counter % 2 === 0 ? 'Administrador Demo' : 'Marcos Vinicius',
      requesterId: counter % 2 === 0 ? 'ADMIN-001' : 'GEST-001',
      requesterSnapshot: snapshotDoUsuario(counter % 2 === 0 ? 'ADMIN-001' : 'GEST-001'),
      alvo: INITIAL_EMPLOYEES[counter % 20].name,
      employeeId: INITIAL_EMPLOYEES[counter % 20].id,
      empresa: INITIAL_EMPLOYEES[counter % 20].company,
      filial: INITIAL_EMPLOYEES[counter % 20].branch,
      centroCusto: INITIAL_EMPLOYEES[counter % 20].costCenter,
      status: 'Em Análise',
      etapaAtual: p.etapas[1] || p.etapas[0],
      responsavelAtual: p.approvals[0]?.responsibilityType === 'diretoria' ? 'Ricardo Silva' : 'Ana Paula Lima',
      slaVencimento: new Date(Date.now() + 24 * 3600000).toISOString(),
      slaStatus: 'normal',
      trail: p.etapas,
      data: getMockData(p.id),
      attachments: [],
      createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      historico: []
    };
    req1.historico = genHist(req1, p.etapas);
    INITIAL_RH_REQUESTS.push(req1);
    counter++;

    // 1 Devolvida
    const req2: RHRequest = {
      id: `req-${counter}`,
      numero: `RH-2026-${String(counter).padStart(4, '0')}`,
      tipoProcesso: p.id,
      processId: p.id,
      processName: p.name,
      category: p.category,
      origem: 'manual',
      solicitante: counter % 3 === 0 ? 'Carlos Eduardo' : 'Marcos Vinicius',
      requesterId: counter % 3 === 0 ? 'COLAB-001' : 'GEST-001',
      requesterSnapshot: snapshotDoUsuario(counter % 3 === 0 ? 'COLAB-001' : 'GEST-001'),
      alvo: INITIAL_EMPLOYEES[(counter + 1) % 20].name,
      employeeId: INITIAL_EMPLOYEES[(counter + 1) % 20].id,
      empresa: INITIAL_EMPLOYEES[(counter + 1) % 20].company,
      filial: INITIAL_EMPLOYEES[(counter + 1) % 20].branch,
      centroCusto: INITIAL_EMPLOYEES[(counter + 1) % 20].costCenter,
      status: 'Devolvida',
      etapaAtual: p.etapas[0],
      responsavelAtual: counter % 3 === 0 ? 'Carlos Eduardo' : 'Marcos Vinicius',
      slaVencimento: new Date(Date.now() - 48 * 3600000).toISOString(),
      slaStatus: 'critical',
      trail: p.etapas,
      data: getMockData(p.id),
      attachments: [],
      createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
      historico: []
    };
    req2.historico = genHist(req2, p.etapas);
    INITIAL_RH_REQUESTS.push(req2);
    counter++;

    // 1 Concluída
    const req3: RHRequest = {
      id: `req-${counter}`,
      numero: `RH-2026-${String(counter).padStart(4, '0')}`,
      tipoProcesso: p.id,
      processId: p.id,
      processName: p.name,
      category: p.category,
      origem: 'manual',
      solicitante: 'Ana Paula Lima',
      requesterId: 'RH-001',
      requesterSnapshot: snapshotDoUsuario('RH-001'),
      alvo: INITIAL_EMPLOYEES[(counter + 2) % 20].name,
      employeeId: INITIAL_EMPLOYEES[(counter + 2) % 20].id,
      empresa: INITIAL_EMPLOYEES[(counter + 2) % 20].company,
      filial: INITIAL_EMPLOYEES[(counter + 2) % 20].branch,
      centroCusto: INITIAL_EMPLOYEES[(counter + 2) % 20].costCenter,
      status: 'Concluída',
      etapaAtual: 'Concluída',
      responsavelAtual: 'Sistema',
      slaVencimento: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
      slaStatus: 'normal',
      trail: p.etapas,
      data: getMockData(p.id),
      attachments: ['doc_final.pdf'],
      createdAt: new Date(Date.now() - 15 * 24 * 3600000).toISOString(),
      updatedAt: new Date(Date.now() - 10 * 24 * 3600000).toISOString(),
      historico: []
    };
    req3.historico = genHist(req3, p.etapas);
    INITIAL_RH_REQUESTS.push(req3);
    counter++;
  });
};

generateInitialRequests();

// Force RH-2026-0052 for specific requirement
const alvoDoReq52 = INITIAL_EMPLOYEES.find(e => e.id === 'EMP-004')!;
const req52: RHRequest = {
  id: 'req-52',
  numero: 'RH-2026-0052',
  tipoProcesso: '7', // Alteração Salarial
  processId: '7',
  processName: 'Alteração Salarial e de Cargo',
  category: 'Cargos e Salários',
  origem: 'manual',
  // `MGR-001` não existia em DEMO_USERS e o snapshot inventava um segundo
  // Marcos Vinicius — matrícula '00102', Gerente Comercial do Comercial —
  // enquanto o cadastro tem um só, Gerente de TI. Agora é o mesmo usuário do
  // resto do seed, com os dados vindos da ficha.
  solicitante: 'Marcos Vinicius',
  requesterId: 'GEST-001',
  requesterSnapshot: snapshotDoUsuario('GEST-001'),
  // O alvo é a ficha da Ana Paula Lima (EMP-004). Aqui estava 'RH-001', que é
  // id de USUÁRIO: não casava com nenhum colaborador e o bloco do alvo abria
  // sem cargo nem setor.
  alvo: alvoDoReq52.name,
  alvoId: alvoDoReq52.id,
  employeeId: alvoDoReq52.id,
  status: 'Em Análise',
  etapaAtual: 'Aprovação',
  responsavelAtual: 'Ricardo Silva',
  slaVencimento: new Date(Date.now() + 48 * 3600000).toISOString(),
  slaStatus: 'normal',
  trail: ['Solicitação', 'Aprovação', 'Conclusão'],
  data: {
    colaborador: alvoDoReq52.name,
    tipo_alteracao: 'Mérito',
    novo_cargo: 'Coordenadora de RH',
    novo_salario: 8500,
    justificativa: 'Excelente desempenho no último semestre e liderança de projetos críticos.',
    vigencia: '2026-08-01'
  },
  attachments: ['Avaliacao_Desempenho.pdf'],
  createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  historico: [
    {
      id: 'h-52-1',
      autor: 'Marcos Vinicius',
      userName: 'Marcos Vinicius',
      etapa: 'Solicitação',
      de: 'Novo',
      para: 'Aprovação',
      action: 'Envio',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
      dataHora: new Date(Date.now() - 24 * 3600000).toISOString(),
      comentario: 'Solicitação de mérito para Ana Paula Lima.'
    }
  ]
};
INITIAL_RH_REQUESTS.push(req52);

const generateOnboardingRequests = () => {
  const process = INITIAL_RH_PROCESSES.find(p => p.id === '4')!;
  const employees = INITIAL_EMPLOYEES.slice(10, 16);
  
  const createTasks = (progress: number): any => {
    const sections = ['rh', 'ti', 'facilities', 'gestor', 'colaborador'];
    const data: any = {};
    
    sections.forEach(section => {
      data[section] = [
        { id: `${section}-1`, task: `Tarefa 1 ${section.toUpperCase()}`, owner: section === 'rh' ? 'Ana Paula' : section === 'ti' ? 'Suporte TI' : 'Gestor', done: progress > 0.5, date: progress > 0.5 ? '2026-07-10' : undefined },
        { id: `${section}-2`, task: `Tarefa 2 ${section.toUpperCase()}`, owner: section === 'rh' ? 'Ana Paula' : section === 'ti' ? 'Suporte TI' : 'Gestor', done: progress > 0.8, date: progress > 0.8 ? '2026-07-12' : undefined }
      ];
    });
    
    return data;
  };

  const onboardingCases = [
    { status: 'Em Análise', progress: 0.3, label: 'Andamento 1' },
    { status: 'Em Análise', progress: 0.6, label: 'Andamento 2' },
    { status: 'Atrasada', progress: 0.4, label: 'Atrasado' }, // Use 'Atrasada' if we want to show it as such, but status is RequestStatus
    { status: 'Concluída', progress: 1.0, label: 'Concluído 1' },
    { status: 'Concluída', progress: 1.0, label: 'Concluído 2' },
    { status: 'Aberto', progress: 0.0, label: 'Aguardando Início' },
  ];

  onboardingCases.forEach((c, idx) => {
    const emp = employees[idx];
    const req: RHRequest = {
      id: `onb-${idx}`,
      numero: `ONB-2026-${String(idx + 1).padStart(4, '0')}`,
      processId: '4',
      processName: 'Onboarding',
      category: 'Recrutamento',
      status: c.status as any,
      solicitante: 'Ana Paula Lima',
      requesterId: 'RH-001',
      alvo: emp.name,
      employeeId: emp.id,
      empresa: emp.company,
      filial: emp.branch,
      centroCusto: emp.costCenter,
      createdAt: new Date(Date.now() - (idx + 1) * 24 * 3600000).toISOString(),
      updatedAt: new Date().toISOString(),
      etapaAtual: c.progress === 1 ? 'Finalizado' : 'Em Integração',
      responsavelAtual: 'Ana Paula Lima',
      data: {
        ...createTasks(c.progress),
        progress: c.progress * 100,
        cargo: emp.role,
        gestor: emp.manager,
        dataAdmissao: emp.admissionDate
      },
      historico: []
    };
    INITIAL_RH_REQUESTS.push(req);
  });
};

generateOnboardingRequests();

// -----------------------------------------------------------------------
// Solicitações das contas usadas na demonstração
//
// "Minhas Solicitações" e "Minhas Aprovações" filtram por quem está logado. O
// seed antigo só produzia pedidos de Marcos (GEST-001), Ana (RH-001) e do
// Administrador Demo — quem entrava com uma conta @jynx (Administrador Geral,
// o caminho normal da demonstração) via as duas abas zeradas.
//
// Para cada conta abaixo entram DOIS lotes:
//  - abertas por ela, em estados variados (concluída, devolvida, em análise);
//  - paradas na mão dela, com a alçada atual apontando para o seu id — é o que
//    `isPendingApprover` (utils/approvalFlow) procura.
// -----------------------------------------------------------------------
// Só o id da conta e a ficha que ela usa: nome, cargo e e-mail saem de
// DEMO_USERS/cadastro na hora de montar o snapshot. As cópias que ficavam aqui
// já divergiam — o e-mail do Ítalo era 'italo@jynx.com.br' contra o
// 'italo.silva@jynx.com.br' com que ele realmente entra.
const CONTAS_DA_DEMO = [
  { id: 'ADMIN-GERAL-001', employeeId: 'EMP-029' },
  { id: 'JYNX-001', employeeId: 'EMP-024' },
  // A Diretoria também abria "Minhas Solicitações" zerada: ela só aparecia como
  // aprovadora. RH/DP, Gestor e Colaborador já têm pedidos no seed antigo.
  { id: 'DIR-002', employeeId: 'EMP-003' }
];

/** Processos usados nos lotes, com um `data` plausível para cada um. */
const MODELOS_DE_PEDIDO: { processId: string; data: Record<string, any> }[] = [
  { processId: '9', data: { periodoAquisitivo: '2024/2025 (30 dias)', dataInicio: '2026-09-15', diasGozo: 15, abonoPecuniario: false, adianta13: false } },
  { processId: '8', data: { competencia: 'Julho/2026', tipoDespesa: 'Hospedagem', fornecedor: 'Hotel Ibis Paulista', data: '2026-07-18', valor: 620.5, justificativa: 'Viagem para acompanhamento da implantação na Filial PR.' } },
  { processId: '14', data: { curso: 'Governança de Dados e LGPD', instituicao: 'FGV', modalidade: 'EAD', dataInicial: '2026-09-01', dataFinal: '2026-11-30', cargaHoraria: 60, custo: 3200, justificativa: 'Atualização exigida pela política de privacidade.' } },
  { processId: '12', data: { data: '2026-07-30', horaInicio: '18:00', horaFim: '21:00', motivo: 'Fechamento Mensal', destino: 'Banco de Horas', observacao: 'Apoio ao fechamento da folha.' } },
  { processId: '6', data: { operacao: 'Inclusão', nomeDependente: 'Laura Martins', parentesco: 'Filho(a)', cpf: '321.654.987-00', dataNascimento: '2024-02-11', beneficioRelacionado: 'Plano de Saúde' } },
  { processId: '7', data: { tipoAlteracao: 'Mérito', novoCargo: 'Analista de Sistemas', novoSalario: 9800, vigencia: '2026-10-01', justificativa: 'Reconhecimento por desempenho no ciclo anual.' } },
  { processId: '11', data: { tipoMovimentacao: 'Troca de Setor', filialDestino: 'Matriz', setorDestino: 'TI', ccDestino: '2020 - TI', vigencia: '2026-09-01', justificativa: 'Realocação para a squad de integrações.' } },
  { processId: '1', data: { tipoRequisicao: 'aumento_quadro', empresa: 'RH360 Holding', filial: 'Matriz', setor: 'TI', centroCusto: '2020 - TI', cargo: 'Desenvolvedor', quantidadeVagas: 1, dataDesejada: '2026-10-01', tipoContrato: 'CLT', modalidade: 'Híbrido', prioridade: 'Alta', justificativa: 'Ampliação da equipe de integrações.' } }
];

/** Estados de "abertas por mim": conclui, devolve e deixa uma em análise. */
const ESTADOS_PROPRIOS: { status: RHRequest['status']; etapa: string; sla: RHRequest['slaStatus'] }[] = [
  { status: 'Concluída', etapa: 'Conclusão', sla: 'normal' },
  { status: 'Concluída', etapa: 'Conclusão', sla: 'normal' },
  { status: 'Devolvida', etapa: 'Solicitação', sla: 'warning' },
  { status: 'Em Análise', etapa: 'Aprovação', sla: 'normal' }
];

/** Estados de "esperando minha aprovação". */
const ESTADOS_PARA_APROVAR: { status: RHRequest['status']; sla: RHRequest['slaStatus'] }[] = [
  { status: 'Pendente de Aprovação', sla: 'normal' },
  { status: 'Pendente de Aprovação', sla: 'warning' },
  { status: 'Em Aprovação', sla: 'critical' },
  { status: 'Em Análise', sla: 'normal' }
];

/**
 * Quem abre os pedidos que caem na aprovação das contas da demonstração. Só o
 * id do usuário: nome, matrícula, cargo e setor saem do cadastro na hora de
 * montar o snapshot — repetir esses campos aqui era mais uma cópia para
 * divergir da ficha.
 */
const SOLICITANTES_TERCEIROS = ['GEST-001', 'RH-001', 'COLAB-001', 'GEST-001'];

const generateDemoAccountRequests = () => {
  // Continua a numeração de onde o seed parou, para não colidir com o contador.
  let sequencia = INITIAL_RH_REQUESTS.length + 1;

  const proximoNumero = () => `RH-2026-${String(sequencia++).padStart(4, '0')}`;

  CONTAS_DA_DEMO.forEach((conta, contaIdx) => {
    const emp = INITIAL_EMPLOYEES.find(e => e.id === conta.employeeId);
    // Mesma fonte de todo o resto do seed. O `|| '00000'` que ficava aqui era
    // um valor de reserva que virava matrícula na tela quando o vínculo
    // falhava — e falhar em silêncio é justamente o que não pode acontecer com
    // o número que identifica a pessoa.
    const snapshotDaConta = snapshotDoUsuario(conta.id);
    const nomeDaConta = snapshotDaConta.name;

    // --- Lote 1: abertas pela conta ---
    ESTADOS_PROPRIOS.forEach((estado, i) => {
      const modelo = MODELOS_DE_PEDIDO[(contaIdx * 4 + i) % MODELOS_DE_PEDIDO.length];
      const processo = INITIAL_RH_PROCESSES.find(p => p.id === modelo.processId)!;
      const aberto = new Date(Date.now() - (6 + i * 3) * 24 * 3600000).toISOString();
      const concluida = estado.status === 'Concluída';
      const numero = proximoNumero();

      INITIAL_RH_REQUESTS.push({
        id: `req-demo-${conta.id}-own-${i}`,
        numero,
        tipoProcesso: processo.id,
        processId: processo.id,
        processName: processo.name,
        category: processo.category,
        origem: 'manual',
        solicitante: nomeDaConta,
        requesterId: conta.id,
        requesterSnapshot: snapshotDaConta,
        alvo: nomeDaConta,
        employeeId: conta.employeeId,
        empresa: emp?.company || 'RH360 Corporate',
        filial: emp?.branch || 'Matriz SP',
        centroCusto: emp?.costCenter || 'TI-001',
        status: estado.status,
        etapaAtual: estado.etapa,
        responsavelAtual: concluida ? '' : estado.status === 'Devolvida' ? nomeDaConta : 'RH da Filial',
        slaVencimento: new Date(Date.now() + (concluida ? -3 : 2) * 24 * 3600000).toISOString(),
        slaStatus: estado.sla,
        trail: ['Solicitação', 'Aprovação', 'Conclusão'],
        approvalChain: [
          {
            id: `app-demo-${conta.id}-own-${i}`,
            name: 'Aprovação',
            order: 1,
            responsibilityType: 'rh-filial',
            responsibleLabel: 'RH da Filial',
            responsibleUserId: 'RH-001',
            sla: 24,
            slaUnit: 'h',
            isMandatory: true,
            status: concluida ? 'aprovado' : 'pendente',
            decidedBy: concluida ? 'Ana Paula Lima' : undefined,
            decidedAt: concluida ? new Date(Date.now() - 2 * 24 * 3600000).toISOString() : undefined
          }
        ],
        data: modelo.data,
        attachments: [],
        createdAt: aberto,
        updatedAt: new Date(Date.now() - i * 24 * 3600000).toISOString(),
        historico: [
          {
            id: `h-${numero}-1`,
            autor: nomeDaConta,
            userName: nomeDaConta,
            userId: conta.id,
            etapa: 'Solicitação',
            de: 'Novo',
            para: 'Aprovação',
            action: 'Envio',
            dataHora: aberto,
            timestamp: aberto,
            comentario: 'Solicitação enviada. Fluxo com 1 nível(is) de aprovação: Aprovação.'
          },
          ...(estado.status === 'Devolvida' ? [{
            id: `h-${numero}-2`,
            autor: 'Ana Paula Lima',
            userName: 'Ana Paula Lima',
            etapa: 'Aprovação',
            de: 'Pendente de Aprovação',
            para: 'Devolvida',
            action: 'Devolução',
            dataHora: new Date(Date.now() - 24 * 3600000).toISOString(),
            timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
            comentario: 'Anexar o comprovante legível antes de reenviar.',
            motivo: 'Anexar o comprovante legível antes de reenviar.'
          }] : []),
          ...(concluida ? [{
            id: `h-${numero}-2`,
            autor: 'Ana Paula Lima',
            userName: 'Ana Paula Lima',
            etapa: 'Aprovação',
            de: 'Pendente de Aprovação',
            para: 'Concluída',
            action: 'Aprovação Final',
            dataHora: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
            timestamp: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
            comentario: 'Aprovado conforme política vigente.'
          }] : [])
        ]
      });
    });

    // --- Lote 2: esperando a aprovação da conta ---
    ESTADOS_PARA_APROVAR.forEach((estado, i) => {
      const modelo = MODELOS_DE_PEDIDO[(contaIdx * 4 + i + 4) % MODELOS_DE_PEDIDO.length];
      const processo = INITIAL_RH_PROCESSES.find(p => p.id === modelo.processId)!;
      const solicitanteId = SOLICITANTES_TERCEIROS[i % SOLICITANTES_TERCEIROS.length];
      const solicitante = snapshotDoUsuario(solicitanteId);
      const alvoEmp = INITIAL_EMPLOYEES[(contaIdx * 4 + i) % 20];
      const aberto = new Date(Date.now() - (1 + i) * 24 * 3600000).toISOString();
      const numero = proximoNumero();

      INITIAL_RH_REQUESTS.push({
        id: `req-demo-${conta.id}-appr-${i}`,
        numero,
        tipoProcesso: processo.id,
        processId: processo.id,
        processName: processo.name,
        category: processo.category,
        origem: 'manual',
        solicitante: solicitante.name,
        requesterId: solicitanteId,
        requesterSnapshot: solicitante,
        alvo: alvoEmp.name,
        alvoId: alvoEmp.id,
        employeeId: alvoEmp.id,
        empresa: alvoEmp.company,
        filial: alvoEmp.branch,
        centroCusto: alvoEmp.costCenter,
        status: estado.status,
        // A alçada pendente aponta para a conta: é isso que faz a solicitação
        // aparecer em "Minhas Aprovações" dela e em nenhuma outra.
        etapaAtual: 'Aprovação Administrativa',
        responsavelAtual: nomeDaConta,
        slaVencimento: new Date(Date.now() + (estado.sla === 'critical' ? -1 : 1) * 24 * 3600000).toISOString(),
        slaStatus: estado.sla,
        trail: ['Solicitação', 'Aprovação Administrativa', 'Conclusão'],
        approvalChain: [
          {
            id: `app-demo-${conta.id}-appr-${i}`,
            name: 'Aprovação Administrativa',
            order: 1,
            responsibilityType: 'pessoa',
            responsibleLabel: nomeDaConta,
            responsibleUserId: conta.id,
            sla: 24,
            slaUnit: 'h',
            isMandatory: true,
            status: 'pendente'
          }
        ],
        data: modelo.data,
        attachments: [],
        createdAt: aberto,
        updatedAt: aberto,
        historico: [
          {
            id: `h-${numero}-1`,
            autor: solicitante.name,
            userName: solicitante.name,
            userId: solicitanteId,
            etapa: 'Solicitação',
            de: 'Novo',
            para: 'Aprovação Administrativa',
            action: 'Envio',
            dataHora: aberto,
            timestamp: aberto,
            comentario: `Solicitação enviada. Aguardando aprovação de ${nomeDaConta}.`
          }
        ]
      });
    });
  });
};

// A chamada fica DEPOIS do seed de desligamento (fim do arquivo): ele fixa o
// número RH-2026-0053 à mão, e este gerador numera a partir do fim da lista.

// -----------------------------------------------------------------------
// Desligamento aprovado aguardando a etapa "Benefícios e Encerramento"
//
// É o ponto de entrada da demonstração da etapa: a cascata (Diretoria) já
// aprovou, então não há mais nada a aprovar — o que falta é o RH/DP lançar as
// verbas, executar o checklist e anexar os documentos. Sem justa causa de
// propósito: é o tipo com a lista de verbas completa (multa de 40%, saque
// integral do FGTS e seguro-desemprego).
// -----------------------------------------------------------------------
const desligadoDemo = INITIAL_EMPLOYEES.find(e => e.id === 'EMP-007')!;
const aprovadoEm = new Date(Date.now() - 3 * 24 * 3600000).toISOString();
const abertoEm = new Date(Date.now() - 6 * 24 * 3600000).toISOString();

const reqDesligamentoEncerramento: RHRequest = {
  id: 'req-desligamento-encerramento',
  numero: 'RH-2026-0053',
  tipoProcesso: '15',
  processId: '15',
  processName: 'Solicitação de Desligamento',
  category: 'Desligamento',
  origem: 'manual',
  solicitante: 'Marcos Vinicius',
  requesterId: 'GEST-001',
  requesterSnapshot: snapshotDoUsuario('GEST-001'),
  alvo: desligadoDemo.name,
  alvoId: desligadoDemo.id,
  employeeId: desligadoDemo.id,
  empresa: desligadoDemo.company,
  filial: desligadoDemo.branch,
  centroCusto: desligadoDemo.costCenter,
  status: 'Aguardando Encerramento',
  etapaAtual: ETAPA_ENCERRAMENTO,
  responsavelAtual: 'RH / DP',
  slaVencimento: new Date(Date.now() + 2 * 24 * 3600000).toISOString(),
  slaStatus: 'warning',
  trail: ['Solicitação', 'Diretoria', ETAPA_ENCERRAMENTO, 'Conclusão'],
  approvalChain: [
    {
      id: 'app-15-1',
      name: 'Diretoria',
      order: 1,
      responsibilityType: 'diretoria',
      responsibleLabel: 'Diretoria',
      responsibleUserId: 'DIR-001',
      sla: 24,
      slaUnit: 'h',
      isMandatory: true,
      status: 'aprovado',
      decidedBy: 'Ricardo Silva',
      decidedAt: aprovadoEm,
      comment: 'Reestruturação aprovada. Encaminhar ao DP para as verbas rescisórias.'
    }
  ],
  data: {
    // O zoom grava o NOME em `colaboradorId` e o id real em `colaboradorIdId`.
    colaboradorId: desligadoDemo.name,
    colaboradorIdId: desligadoDemo.id,
    cargo: desligadoDemo.role,
    setor: desligadoDemo.department,
    centroCusto: desligadoDemo.costCenter,
    admissao: desligadoDemo.admissionDate,
    gestor: desligadoDemo.manager,
    tipoDesligamento: 'sem_justa_causa',
    motivo: 'Reestruturação',
    motivoComplementar: 'Encerramento da célula de sustentação da Filial Goiânia, com absorção das atividades pela Matriz.',
    avisoPrevio: 'Indenizado',
    dataAvisoPrevio: '2026-07-31',
    ultimoDiaTrabalhado: '2026-07-31',
    dataPrevistaDesligamento: '2026-09-14',
    reposicao: 'Não',
    observacao: 'Colaborador ciente do desligamento em reunião com o gestor e o RH.'
  },
  attachments: [],
  createdAt: abertoEm,
  updatedAt: aprovadoEm,
  historico: [
    {
      id: 'h-desl-1',
      autor: 'Marcos Vinicius',
      userName: 'Marcos Vinicius',
      userId: 'GEST-001',
      etapa: 'Solicitação',
      de: 'Novo',
      para: 'Diretoria',
      action: 'Envio',
      dataHora: abertoEm,
      timestamp: abertoEm,
      comentario: 'Solicitação enviada. Fluxo com 1 nível(is) de aprovação: Diretoria.'
    },
    {
      id: 'h-desl-2',
      autor: 'Ricardo Silva',
      userName: 'Ricardo Silva',
      userId: 'DIR-001',
      etapa: 'Diretoria',
      de: 'Pendente de Aprovação',
      para: ETAPA_ENCERRAMENTO,
      action: 'Aprovação Final',
      dataHora: aprovadoEm,
      timestamp: aprovadoEm,
      comentario: `Última alçada aprovada (Diretoria). Encaminhado ao RH/DP para ${ETAPA_ENCERRAMENTO}.`
    }
  ]
};
INITIAL_RH_REQUESTS.push(reqDesligamentoEncerramento);

// Numera a partir daqui (RH-2026-0054 em diante), depois do último número fixo.
generateDemoAccountRequests();

// Update total counter for persistence
export const INITIAL_REQUEST_COUNTER = INITIAL_RH_REQUESTS.length;

// TASKS (Coherent with requests)
export const INITIAL_TASKS: Task[] = INITIAL_RH_REQUESTS
  .filter(r => r.status === 'Em Análise' || r.status === 'Devolvida')
  .map(r => {
    const isApproval = r.status === 'Em Análise';
    const assignedToId = isApproval 
      ? (r.responsavelAtual === 'Ricardo Silva' ? 'DIR-001' : 'RH-001')
      : r.requesterId;

    return {
      id: `task-${r.id}`,
      title: isApproval ? `Aprovar ${r.processName}` : `Corrigir ${r.processName}`,
      description: isApproval ? `Revisar solicitação ${r.numero}` : `Ajustar dados na solicitação ${r.numero}`,
      assignedTo: assignedToId || 'ADMIN-001',
      dueDate: r.slaVencimento,
      status: 'Pendente',
      priority: r.slaStatus === 'critical' ? 'Alta' : 'Média',
      relatedRequestId: r.id,
      createdAt: r.createdAt,
      
      // Workflow metadata
      requestId: r.id,
      requestNumber: r.numero,
      processId: r.tipoProcesso || r.processId,
      process: r.processName,
      solicitante: r.solicitante,
      type: isApproval ? 'Aprovação' : 'Ajuste',
      responsible: r.responsavelAtual || r.solicitante,
      responsibleUserId: assignedToId || 'ADMIN-001',
      prazo: r.slaVencimento
    };
  });

// A etapa de Benefícios e Encerramento entra na Central de Tarefas como
// qualquer outra pendência — é por ela que o RH/DP chega ao desligamento
// aprovado do seed.
INITIAL_TASKS.unshift({
  id: `task-${reqDesligamentoEncerramento.id}`,
  title: `${ETAPA_ENCERRAMENTO} - ${reqDesligamentoEncerramento.alvo}`,
  description: `Desligamento aprovado. Lançar verbas rescisórias, executar o checklist e anexar os documentos da rescisão (${reqDesligamentoEncerramento.numero}).`,
  assignedTo: 'RH-001',
  dueDate: reqDesligamentoEncerramento.slaVencimento!,
  status: 'Pendente',
  priority: 'Alta',
  relatedRequestId: reqDesligamentoEncerramento.id,
  createdAt: reqDesligamentoEncerramento.updatedAt!,
  requestId: reqDesligamentoEncerramento.id,
  requestNumber: reqDesligamentoEncerramento.numero,
  processId: '15',
  process: reqDesligamentoEncerramento.processName,
  solicitante: reqDesligamentoEncerramento.solicitante,
  type: 'Encerramento',
  responsible: 'RH/DP',
  responsibleUserId: 'RH-001',
  prazo: reqDesligamentoEncerramento.slaVencimento
});

// JOBS
export const INITIAL_JOBS: Job[] = [
  {
    id: 'VAG-001',
    code: 'VAG-001',
    title: 'Desenvolvedor Full Stack',
    company: 'RH360 Corporate',
    branch: 'Matriz SP',
    department: 'TI',
    sector: 'Desenvolvimento',
    costCenter: '2020 - TI',
    location: 'São Paulo, SP',
    quantity: 1,
    status: 'Aberto',
    type: 'CLT',
    salaryRange: 'R$ 8.000,00 - R$ 12.000,00',
    createdAt: '2024-01-15',
  },
  {
    id: 'VAG-002',
    code: 'VAG-002',
    title: 'Analista de RH',
    company: 'RH360 Corporate',
    branch: 'Matriz SP',
    department: 'RH',
    sector: 'Recrutamento',
    costCenter: '1010 - ADM',
    location: 'São Paulo, SP',
    quantity: 1,
    status: 'Aberto',
    type: 'CLT',
    salaryRange: 'R$ 5.000,00 - R$ 7.000,00',
    createdAt: '2024-01-20',
  },
  {
    id: 'VAG-003',
    code: 'VAG-003',
    title: 'Assistente Financeiro',
    company: 'RH360 Serviços',
    branch: 'Campinas',
    department: 'Financeiro',
    sector: 'Contas a Pagar',
    costCenter: '3030 - COM',
    location: 'Campinas, SP',
    quantity: 1,
    status: 'Aberto',
    type: 'CLT',
    salaryRange: 'R$ 3.000,00 - R$ 4.000,00',
    createdAt: '2024-01-25',
  },
  // Vaga aprovada da Filial PR — é a origem do pré-admitido Rafael Monteiro
  // (EMP-AD-DEMO-002) no seed da Admissão Digital.
  {
    id: 'VAG-004',
    code: 'VAG-004',
    title: 'Analista de Suporte Técnico',
    company: 'RH360 Corporate',
    branch: 'Filial PR',
    department: 'TI',
    sector: 'Suporte',
    costCenter: '2020 - TI',
    location: 'Curitiba, PR',
    quantity: 1,
    status: 'Aberto',
    type: 'CLT',
    salaryRange: 'R$ 4.000,00 - R$ 5.500,00',
    createdAt: '2026-07-10',
  },
  { 
    id: 'v1', 
    code: 'VAGA-2026-001',
    title: 'Desenvolvedor Full Stack Sênior', 
    company: 'RH360 Holding',
    branch: 'Matriz',
    department: 'Tecnologia', 
    sector: 'TI',
    costCenter: '2020 - TI',
    location: 'São Paulo (Híbrido)', 
    quantity: 2,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 15.000 - R$ 20.000', 
    createdAt: '2026-06-01' 
  },
  { 
    id: 'v2', 
    code: 'VAGA-2026-002',
    title: 'Analista de Marketing Pleno', 
    company: 'RH360 Filial SP',
    branch: 'Escritório',
    department: 'Marketing', 
    sector: 'Vendas',
    costCenter: '3030 - COM',
    location: 'Remoto', 
    quantity: 1,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 6.000 - R$ 8.000', 
    createdAt: '2026-06-15' 
  },
  { 
    id: 'v3', 
    code: 'VAGA-2026-003',
    title: 'Gerente Comercial', 
    company: 'RH360 Holding',
    branch: 'Matriz',
    department: 'Comercial', 
    sector: 'Vendas',
    costCenter: '3030 - COM',
    location: 'São Paulo', 
    quantity: 1,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 12.000 - R$ 18.000', 
    createdAt: '2026-07-01' 
  },
  { 
    id: 'v4', 
    code: 'VAGA-2026-004',
    title: 'Analista de RH', 
    company: 'RH360 Holding',
    branch: 'Matriz',
    department: 'Recursos Humanos', 
    sector: 'RH',
    costCenter: '1010 - ADM',
    location: 'São Paulo', 
    quantity: 1,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 5.000 - R$ 7.000', 
    createdAt: '2026-07-05' 
  },
  { 
    id: 'v5', 
    code: 'VAGA-2026-005',
    title: 'Analista Financeiro', 
    company: 'RH360 Filial RJ',
    branch: 'Escritório',
    department: 'Financeiro', 
    sector: 'Financeiro',
    costCenter: '1010 - ADM',
    location: 'Rio de Janeiro', 
    quantity: 1,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 7.000 - R$ 9.000', 
    createdAt: '2026-07-10' 
  },
  { 
    id: 'v6', 
    code: 'VAGA-2026-006',
    title: 'Coordenador Operacional', 
    company: 'RH360 Filial SP',
    branch: 'Centro de Distribuição',
    department: 'Operações', 
    sector: 'Operações',
    costCenter: '4040 - OPS',
    location: 'São Paulo', 
    quantity: 1,
    status: 'Aberto', 
    type: 'CLT', 
    salaryRange: 'R$ 8.000 - R$ 10.000', 
    createdAt: '2026-07-12' 
  },
];

// APPLICATIONS
export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'CAND-APP-001',
    jobId: 'VAG-001',
    candidateName: 'Mariana Souza',
    email: 'mariana.souza@email.com',
    phone: '(11) 98888-1001',
    status: 'Aprovado',
    source: 'LinkedIn',
    score: 95,
    appliedAt: '2024-02-01',
  },
  {
    id: 'CAND-APP-002',
    jobId: 'VAG-002',
    candidateName: 'Felipe Martins',
    email: 'felipe.martins@email.com',
    phone: '(11) 98888-1002',
    status: 'Aprovado',
    source: 'Indicação',
    score: 88,
    appliedAt: '2024-02-05',
  },
  {
    id: 'CAND-APP-003',
    jobId: 'VAG-003',
    candidateName: 'Camila Rocha',
    email: 'camila.rocha@email.com',
    phone: '(19) 98888-1003',
    status: 'Aprovado',
    source: 'Gupy',
    score: 92,
    appliedAt: '2024-02-10',
  },
  // Triagem (3)
  { id: 'c1', jobId: 'v1', candidateName: 'Alice Souza', email: 'alice.souza@email.com', phone: '(11) 98888-7777', status: 'Triagem', source: 'LinkedIn', appliedAt: '2026-06-10', notes: 'Perfil técnico forte em React.' },
  { id: 'c2', jobId: 'v1', candidateName: 'Bruno Oliveira', email: 'bruno.o@email.com', phone: '(11) 97777-6666', status: 'Triagem', source: 'Gupy', appliedAt: '2026-06-12', notes: 'Experiência com Node.js.' },
  { id: 'c3', jobId: 'v2', candidateName: 'Carla Dias', email: 'carla.dias@email.com', phone: '(21) 96666-5555', status: 'Triagem', source: 'Indicação', appliedAt: '2026-06-15', notes: 'Indicada por Marcos Vinicius.' },
  
  // Entrevista RH (2)
  { id: 'c4', jobId: 'v1', candidateName: 'Daniel Santos', email: 'daniel.s@email.com', phone: '(11) 95555-4444', status: 'Entrevista RH', source: 'LinkedIn', appliedAt: '2026-06-05', score: 8, notes: 'Boa comunicação.' },
  { id: 'c5', jobId: 'v3', candidateName: 'Eduarda Lima', email: 'eduarda.l@email.com', phone: '(11) 94444-3333', status: 'Entrevista RH', source: 'Site', appliedAt: '2026-07-02', score: 9, notes: 'Experiência em vendas B2B.' },
  
  // Entrevista Gestor (2)
  { id: 'c6', jobId: 'v1', candidateName: 'Fabio Jr', email: 'fabio.jr@email.com', phone: '(11) 93333-2222', status: 'Entrevista Gestor', source: 'LinkedIn', appliedAt: '2026-06-01', score: 8.5, notes: 'Gostou do desafio técnico.' },
  { id: 'c7', jobId: 'v4', candidateName: 'Gabriela Ferraz', email: 'gabi.f@email.com', phone: '(11) 92222-1111', status: 'Entrevista Gestor', source: 'Gupy', appliedAt: '2026-07-06', score: 9.5, notes: 'Excelente perfil comportamental.' },
  
  // Aprovados (3)
  { id: 'c8', jobId: 'v1', candidateName: 'Henrique Mello', email: 'henrique.m@email.com', phone: '(11) 91111-0000', status: 'Aprovado', source: 'LinkedIn', appliedAt: '2026-05-25', score: 10, notes: 'Aprovado pelo gestor. Aguardando admissão.' },
  { id: 'c9', jobId: 'v2', candidateName: 'Isabela Rocha', email: 'isabela.r@email.com', phone: '(11) 90000-9999', status: 'Aprovado', source: 'Indicação', appliedAt: '2026-06-20', score: 9.8, notes: 'Ótima candidata.' },
  { id: 'c10', jobId: 'v5', candidateName: 'João Vitor', email: 'joao.v@email.com', phone: '(21) 98888-8888', status: 'Aprovado', source: 'Site', appliedAt: '2026-07-11', score: 9, notes: 'Processo rápido.' },
];

// ANNOUNCEMENTS
// O carrossel de comunicados oficiais usa os itens que têm `imagem`. Com um
// item só as setas ‹ › não tinham para onde ir e pareciam quebradas — daí os
// quatro comunicados de exemplo, com banners e categorias diferentes.
export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'a1',
    title: 'Novo Plano de Saúde',
    content: 'A partir do mês que vem teremos novos benefícios: rede credenciada ampliada, telemedicina 24h e coparticipação reduzida. O RH abre inscrições para dependentes na primeira semana.',
    author: 'RH',
    date: '10/07/2026',
    category: 'RH',
    priority: 'Importante',
    imagem: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1200',
    comentarios: [
      { id: 'c-a1-1', autor: 'Ana Paula Lima', autorId: 'RH-001', texto: 'A rede credenciada nova já vale para dependentes?', dataHora: '2026-07-10T14:20:00.000Z' }
    ]
  },
  {
    id: 'a2',
    title: 'Política de Trabalho Híbrido: mais flexibilidade para você',
    content: 'A partir de agosto cada time define os dias presenciais junto com o gestor, respeitando o mínimo de dois encontros por mês. O guia completo está na base de conhecimento.',
    author: 'Comunicação Corporativa',
    date: '12/07/2026',
    category: 'Geral',
    priority: 'Normal',
    imagem: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200',
    comentarios: []
  },
  {
    id: 'a3',
    title: 'Hackathon interno 2026: inscrições abertas',
    content: 'Três dias para transformar ideias em protótipos, com mentoria da liderança técnica. Times de até cinco pessoas, de qualquer área. As inscrições vão até o dia 25.',
    author: 'Tecnologia',
    date: '15/07/2026',
    category: 'Evento',
    priority: 'Normal',
    imagem: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1200',
    comentarios: []
  },
  {
    id: 'a4',
    title: 'Manutenção programada dos sistemas no fim de semana',
    content: 'No sábado, das 8h às 12h, o portal e a folha ficam indisponíveis para atualização de infraestrutura. Solicitações em andamento não são perdidas.',
    author: 'TI',
    date: '18/07/2026',
    category: 'TI',
    priority: 'Importante',
    imagem: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1200',
    comentarios: []
  }
];

// PROCESS DEFINITIONS FOR FORM RENDERER
export const INITIAL_PROCESS_DEFINITIONS: Record<string, any[]> = {
  '7': [
    {
      id: 'current',
      title: 'Dados Atuais',
      fields: [
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name', 'role', 'salary', 'department', 'costCenter', 'manager'] } },
        { id: 'cargo_atual', label: 'Cargo Atual', type: 'text', disabled: true, source: 'colaborador.role' },
        { id: 'salario_atual', label: 'Salário Atual', type: 'currency', disabled: true, source: 'colaborador.salary' },
        { id: 'setor_atual', label: 'Setor Atual', type: 'text', disabled: true, source: 'colaborador.department' },
        { id: 'cc_atual', label: 'Centro de Custo Atual', type: 'text', disabled: true, source: 'colaborador.costCenter' },
        { id: 'gestor_atual', label: 'Gestor Atual', type: 'text', disabled: true, source: 'colaborador.manager' }
      ]
    },
    {
      id: 'new',
      title: 'Nova Configuração',
      fields: [
        { id: 'tipo_alteracao', label: 'Tipo de Alteração', type: 'select', required: true, options: ['Promoção', 'Mérito', 'Enquadramento', 'Substituição', 'Aumento de Carga Horária'] },
        { id: 'novo_cargo', label: 'Novo Cargo', type: 'select', required: true, options: ROLES },
        { id: 'novo_salario', label: 'Novo Salário', type: 'currency', required: true },
        { id: 'novo_setor', label: 'Novo Setor', type: 'select', options: SECTORS.map(s => s.name) },
        { id: 'novo_cc', label: 'Novo Centro de Custo', type: 'select', options: COST_CENTERS.map(c => c.name) },
        { id: 'novo_gestor', label: 'Novo Gestor', type: 'select', options: DEMO_USERS.filter(u => u.profile === 'Gestor' || u.profile === 'Diretoria').map(u => u.name) },
        { id: 'vigencia', label: 'Vigência', type: 'date', required: true },
        { id: 'calculo', label: 'Cálculo de Impacto', type: 'calc', source: 'novo_salario - salario_atual' },
        { id: 'justificativa', label: 'Justificativa', type: 'textarea', required: true },
        { id: 'anexos', label: 'Anexos', type: 'file', multiple: true }
      ]
    }
  ],
  '8': [
    {
      id: 'info',
      title: 'Informações Básicas',
      fields: [
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name', 'department'] } },
        { id: 'tipo', label: 'Tipo de Despesa', type: 'select', required: true, options: ['Viagem', 'Refeição', 'Transporte', 'Hospedagem', 'KM Rodado', 'Outros'] },
        { id: 'competencia', label: 'Competência', type: 'date', required: true }
      ]
    },
    {
      id: 'items',
      title: 'Itens da Prestação',
      fields: [
        { id: 'despesas', label: 'Despesas', type: 'grid', columns: [
          { id: 'fornecedor', label: 'Fornecedor', type: 'text' },
          { id: 'nf', label: 'NF/Recibo', type: 'text' },
          { id: 'data', label: 'Data', type: 'date' },
          { id: 'valor', label: 'Valor', type: 'currency' },
          { id: 'comprovante', label: 'Comprovante', type: 'file' }
        ]}
      ]
    }
  ],
  '10': [
    {
      id: 'md',
      title: 'Medida Disciplinar',
      fields: [
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name', 'role', 'department'] } },
        { id: 'tipo', label: 'Tipo de Medida', type: 'select', required: true, options: ['Advertência Verbal', 'Advertência Escrita', 'Suspensão', 'Justa Causa'] },
        { id: 'gravidade', label: 'Gravidade', type: 'select', required: true, options: ['Leve', 'Média', 'Grave', 'Gravíssima'] },
        { id: 'data_hora', label: 'Data e Hora do Fato', type: 'date', required: true },
        { id: 'local', label: 'Local', type: 'text', required: true },
        { id: 'fatos', label: 'Relato dos Fatos', type: 'textarea', required: true },
        { id: 'testemunhas', label: 'Testemunhas', type: 'text' },
        { id: 'evidencias', label: 'Evidências', type: 'file', multiple: true },
        { id: 'juridico', label: 'Necessário Parecer Jurídico?', type: 'checkbox' },
        { id: 'medida', label: 'Medida Aplicada', type: 'textarea', required: true },
        { id: 'suspensao', label: 'Dias de Suspensão (se aplicável)', type: 'number' },
        { id: 'assinatura', label: 'Assinatura do Colaborador (Simulada)', type: 'signature' }
      ]
    }
  ],
  '11': [
    {
      id: 'mov',
      title: 'Movimentação',
      fields: [
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name', 'company', 'branch', 'department', 'costCenter', 'manager'] } },
        { id: 'empresa_destino', label: 'Empresa Destino', type: 'select', required: true, options: COMPANIES.map(c => c.name) },
        { id: 'filial_destino', label: 'Filial Destino', type: 'select', required: true, options: BRANCHES },
        { id: 'setor_destino', label: 'Setor Destino', type: 'select', required: true, options: SECTORS.map(s => s.name) },
        { id: 'cc_destino', label: 'Centro de Custo Destino', type: 'select', required: true, options: COST_CENTERS.map(c => c.name) },
        { id: 'gestor_destino', label: 'Gestor Destino', type: 'select', required: true, options: DEMO_USERS.filter(u => u.profile === 'Gestor').map(u => u.name) },
        { id: 'vigencia', label: 'Vigência', type: 'date', required: true },
        { id: 'temporaria', label: 'Temporária?', type: 'toggle' },
        { id: 'fim_temporario', label: 'Data Fim (se temporária)', type: 'date' },
        { id: 'justificativa', label: 'Justificativa', type: 'textarea', required: true }
      ]
    }
  ],
  '12': [
    {
      id: 'he',
      title: 'Horas Extra',
      fields: [
        { id: 'modalidade', label: 'Modalidade', type: 'radio', options: ['Individual', 'Múltipla'] },
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name'] } },
        { id: 'data', label: 'Data', type: 'date', required: true },
        { id: 'inicio', label: 'Início', type: 'time', required: true },
        { id: 'fim', label: 'Fim', type: 'time', required: true },
        { id: 'previstas', label: 'Horas Previstas', type: 'number', disabled: true },
        { id: 'motivo', label: 'Motivo', type: 'select', required: true, options: ['Projeto Especial', 'Pico de Demanda', 'Substituição', 'Manutenção Preventiva', 'Outros'] },
        { id: 'justificativa', label: 'Justificativa Detalhada', type: 'textarea', required: true },
        { id: 'destino', label: 'Destino', type: 'select', required: true, options: ['Banco de Horas', 'Folha de Pagamento'] }
      ]
    }
  ],
  '13': [
    {
      id: 'hier',
      title: 'Estrutura de Hierarquia',
      fields: [
        { id: 'empresa', label: 'Empresa', type: 'select', required: true, options: COMPANIES.map(c => c.name) },
        { id: 'filial', label: 'Filial', type: 'select', required: true, options: BRANCHES },
        { id: 'setor', label: 'Setor', type: 'select', required: true, options: SECTORS.map(s => s.name) },
        { id: 'gestor_principal', label: 'Gestor Principal', type: 'select', required: true, options: DEMO_USERS.map(u => u.name) },
        { id: 'substituto', label: 'Gestor Substituto', type: 'select', options: DEMO_USERS.map(u => u.name) },
        { id: 'supervisor', label: 'Supervisor Imediato', type: 'select', options: DEMO_USERS.map(u => u.name) },
        { id: 'vigencia', label: 'Vigência da Versão', type: 'date', required: true },
        { id: 'observacao', label: 'Observações Internas', type: 'textarea' }
      ]
    }
  ],
  '15': [
    {
      id: 'term',
      title: 'Dados do Desligamento',
      fields: [
        { id: 'colaborador', label: 'Colaborador', type: 'zoom', required: true, zoomConfig: { entity: 'employee', fields: ['name', 'role', 'salary', 'department', 'admissionDate'] } },
        { id: 'tipo', label: 'Tipo de Desligamento', type: 'select', required: true, options: ['Pedido de Demissão', 'Dispensa sem Justa Causa', 'Dispensa com Justa Causa', 'Término de Contrato', 'Aposentadoria'] },
        { id: 'motivo', label: 'Motivo Detalhado', type: 'select', required: true, options: ['Novo Emprego', 'Mudança de Cidade', 'Problemas Pessoais', 'Performance', 'Ajuste de Quadro'] },
        { id: 'data_aviso', label: 'Data do Aviso', type: 'date', required: true },
        { id: 'data_desligamento', label: 'Último Dia Trabalhado', type: 'date', required: true },
        { id: 'aviso_previo', label: 'Aviso Prévio', type: 'select', required: true, options: ['Trabalhado', 'Indenizado', 'Dispensado'] },
        { id: 'ferias_vencidas', label: 'Pagar Férias Vencidas?', type: 'checkbox' },
        { id: 'devolucao_equipamentos', label: 'Equipamentos Devolvidos?', type: 'checkbox' },
        { id: 'observacoes', label: 'Observações', type: 'textarea' }
      ]
    }
  ]
};

// PARAMETER LISTS
export const ONBOARDING_TEMPLATES = ['Padrão Administrativo', 'Técnico TI', 'Operacional', 'Comercial', 'Liderança'];
export const TRAINING_CATALOG = [
  { id: 't1', name: 'Segurança da Informação', provider: 'RH360 Academy', category: 'Compliance' },
  { id: 't2', name: 'Metodologias Ágeis', provider: 'TechFlow', category: 'Processos' },
  { id: 't3', name: 'Gestão de Conflitos', provider: 'Liderança Master', category: 'Soft Skills' },
  { id: 't4', name: 'Excel Avançado', provider: 'Data School', category: 'Ferramentas' },
  { id: 't5', name: 'Código de Conduta', provider: 'RH360 Corporate', category: 'Compliance' }
];
export const EXPENSE_TYPES = ['Alimentação', 'Transporte', 'Hospedagem', 'KM', 'Material de Escritório', 'Outros'];
export const MOVEMENT_REASONS = ['Promoção', 'Mérito', 'Enquadramento', 'Transferência', 'Troca de Setor', 'Substituição'];
export const TERMINATION_REASONS = ['Pedido de Demissão', 'Sem Justa Causa', 'Justa Causa', 'Fim de Contrato', 'Aposentadoria'];

// BENEFITS
export const INITIAL_BENEFITS: BenefitConfig[] = [
  { id: 'b1', name: 'Plano de Saúde Bradesco', type: 'Saúde', provider: 'Bradesco', active: true, cost: 500 },
  { id: 'b2', name: 'Vale Refeição', type: 'Refeição', provider: 'Sodexo', active: true, cost: 800 },
  { id: 'b3', name: 'Vale Alimentação', type: 'Alimentação', provider: 'Sodexo', active: true, cost: 400 },
  { id: 'b4', name: 'Plano Odontológico Amil', type: 'Saúde', provider: 'Amil', active: true, cost: 150 },
  { id: 'b5', name: 'Seguro de Vida', type: 'Seguro', provider: 'Prudential', active: true, cost: 100 },
  { id: 'b6', name: 'Auxílio Creche', type: 'Auxílio', provider: 'Sistema', active: true, cost: 300 },
  { id: 'b7', name: 'Previdência Privada', type: 'Seguro', provider: 'Itaú', active: true, cost: 200 }
];


// INTEGRATIONS
export const INITIAL_INTEGRATIONS: any[] = [
  { id: 'i1', name: 'ERP Protheus', status: 'Conectado', lastSync: '2026-07-15 08:00' },
  { id: 'i2', name: 'Ponto Eletrônico', status: 'Conectado', lastSync: '2026-07-15 09:00' }
];

// MENU MODULES
export const menuModules = [
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard', active: true },
  { id: 'processos', label: 'Processos RH', icon: 'Workflow', path: '/processos', active: true },
  { id: 'solicitacoes', label: 'Solicitações', icon: 'FileText', path: '/solicitacoes', active: true },
  { id: 'colaboradores', label: 'Colaboradores', icon: 'Users', path: '/colaboradores', active: true },
  { id: 'relatorios', label: 'Relatórios', icon: 'BarChart3', path: '/relatorios', active: true },
  { id: 'configuracoes', label: 'Configurações', icon: 'Settings', path: '/settings', active: true }
];

