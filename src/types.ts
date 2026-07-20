export interface User {
  id: string;
  name: string;
  role: string;
  groups: string[];
  avatar?: string;
  profile: 'Administrador Geral' | 'Administrador' | 'Diretoria' | 'RH/DP' | 'Gestor' | 'Colaborador';
  scope: 'proprio' | 'equipe' | 'setor' | 'centro-custo' | 'filial' | 'empresa' | 'global';
  email: string;
  password?: string;
  employeeId?: string;
  canManageAccesses?: boolean;
  status: 'Ativo' | 'Inativo' | 'Suspenso';
  substituteId?: string;
  substitutePeriod?: { start: string; end: string };
}

export type AccessStatus = 'Ativo' | 'Expirando' | 'Expirado' | 'Bloqueado';

export interface Accesso {
  id: string;
  client: string;
  email: string;
  password: string;
  grantedProfile: User['profile'];
  startDate: string;
  expirationDate: string;
  createdAt: string;
  blocked?: boolean;
}

export type ApprovalResponsibilityType = 
  | 'pessoa' 
  | 'grupo' 
  | 'gestor-direto' 
  | 'gestor-setor' 
  | 'responsavel-cc' 
  | 'rh-filial' 
  | 'diretoria' 
  | 'presidencia';

export interface ApprovalStep {
  id: string;
  name: string;
  order: number;
  active: boolean;
  responsibilityType: ApprovalResponsibilityType;
  responsibilityId?: string; 
  conditionField?: string;
  conditionOperator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains';
  conditionValue?: any;
  sla: number;
  slaUnit: 'h' | 'd';
  isMandatory: boolean;
  returnStep?: string;
}

export interface AIPoint {
  id: string;
  label: string;
  active: boolean;
}

export interface AIConfig {
  enabled: boolean;
  points?: AIPoint[];
  model?: string;
  purpose?: string;
  requireReview?: boolean;
}

export interface ProcessTrailStep {
  id: string;
  name: string;
  actorType: 'Papel' | 'Grupo' | 'Pessoa';
  actorId: string;
  sla: number;
  slaUnit: 'h' | 'd';
  condition?: string;
  requireApproval?: boolean;
  isFixed?: boolean;
}

export enum TargetMode {
  CURRENT_USER = 'CURRENT_USER',
  EMPLOYEE_ZOOM = 'EMPLOYEE_ZOOM',
  CANDIDATE_ZOOM = 'CANDIDATE_ZOOM',
  OBJECT = 'OBJECT',
  CONDITIONAL = 'CONDITIONAL'
}

export interface RHProcess {
  id: string;
  name: string;
  description: string;
  icon: string;
  pendingCount: number;
  ativo: boolean;
  category: 'Recrutamento' | 'Benefícios' | 'Carreira' | 'Operacional' | 'Desligamento' | string;
  viewType: 'request' | 'kanban' | 'checklist' | 'receipt' | 'hierarchy' | 'onboarding' | 'admission' | 'recruitment' | 'vr-va' | 'generic';
  targetMode: TargetMode;
  roles: {
    employee: boolean;
    manager: boolean;
    hr: boolean;
    director: boolean;
  };
  etapas: string[];
  version: number;
  isSensitive: boolean;
  allowDraft: boolean;
  allowCancel: boolean;
  executorGroup?: string;
  slaTotal?: number;
  approvals: ApprovalStep[];
  handoffs?: {
    updateProfile: boolean;
    createRecord360: boolean;
    createTask: boolean;
    generateDoc: boolean;
    requireSignature: boolean;
    nextProcessId?: string;
    handoffType: 'automatico' | 'sugestao' | 'manual' | 'desativado';
  };
  aiConfig: AIConfig;
  trail?: ProcessTrailStep[];
}

export interface IntranetItem {
  id: string;
  title: string;
  summary?: string;
  description?: string; // Add missing field
  content: string;
  image?: string;
  imageUrl?: string; // Add missing field
  url?: string; // Add missing field
  type?: string; // Add missing field
  active?: boolean; // Add missing field
  attachments?: { name: string; url: string }[];
  category: 'Notícia' | 'Comunicado' | 'Evento' | 'Vídeo' | 'Documento' | 'Campanha';
  author: string;
  authorId: string;
  date: string;
  startDate?: string;
  endDate?: string;
  priority: 'Normal' | 'Importante' | 'Crítica';
  status: 'Rascunho' | 'Em Revisão' | 'Agendado' | 'Publicado' | 'Expirado' | 'Arquivado';
  target: {
    profiles?: string[];
    groups?: string[];
    companies?: string[];
    branches?: string[];
    sectors?: string[];
  };
  isSticky?: boolean;
  requireReadConfirmation?: boolean;
}

export interface Unit {
  id: string;
  name: string;
  branchId: string;
}

export interface SalaryBand {
  level: string;
  min: number;
  mid: number;
  max: number;
}

export interface Union {
  id: string;
  name: string;
  code: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user?: string; // Compatible with old
  userId?: string; // Compatible with new
  userName?: string; // Compatible with new
  action: string;
  module: string;
  targetId?: string;
  details: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
  origin?: string;
  requestId?: string;
}

export type EmployeeStatus = 
  | 'Ativo' 
  | 'Inativo'
  | 'Afastado' 
  | 'Férias'
  | 'Pré-admissão' 
  | 'Desligado';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  department: string;
  role: string;
  branch: string;
  company: string;
  status: EmployeeStatus;
  admissionDate: string;
  birthDate: string;
  salary: number;
  manager: string;
  managerId?: string;
  costCenter: string;
  registration: string;
  cpf: string;
  avatar?: string;
  terminationDate?: string;
  dependents?: Dependent[];
  benefits?: Benefit[];
  documents?: EmployeeDocument[];
  occupationalExams?: OccupationalExam[];
  vacationRecords?: VacationRecord[];
  movements?: EmployeeMovement[];
  trainings?: EmployeeTraining[];
  auditLogs?: AuditLog[];
}

export interface Dependent {
  id: string;
  name: string;
  relationship: string;
  birthDate: string;
  cpf: string; 
  benefits?: string[];
  status?: 'Ativo' | 'Inativo';
}

export interface EmployeeMovement {
  id: string;
  date: string;
  type: string;
  from: string;
  to: string;
  previousRole: string;
  newRole: string;
  previousSalary: number;
  newSalary: number;
  requestId?: string;
}

export interface Benefit {
  id: string;
  name: string;
  status: 'Ativo' | 'Inativo';
  enrollmentDate: string;
  linkedDependents?: string[]; 
}

export interface EmployeeTraining {
  id: string;
  course: string;
  hours: string;
  date: string;
  certificateUrl?: string;
  status: 'Concluído' | 'Em Andamento' | 'Expirado';
}

export interface EmployeeDocument {
  id: string;
  type: string;
  number: string;
  issueDate?: string;
  expiryDate?: string;
  status: 'Válido' | 'Próximo do vencimento' | 'Vencido' | 'Pendente' | 'Em validação';
  attachmentUrl?: string;
  origin: 'Upload' | 'Sistema';
}

export interface OccupationalExam {
  id: string;
  type: 'Admissional' | 'Periódico' | 'Demissional';
  date: string;
  expiryDate: string;
  clinic: string;
  status: 'Válido' | 'A vencer' | 'Vencido' | 'Pendente';
  attachmentUrl?: string;
}

export interface VacationRecord {
  id: string;
  acquisitivePeriod: string;
  daysEntitled: number;
  daysTaken: number;
  balance: number;
  scheduledVacation?: string;
  history: { period: string; days: number; status: string }[];
}

export type RequestStatus = 
  | 'Rascunho' 
  | 'Aberto'
  | 'Enviada' 
  | 'Em Aprovação' 
  | 'Em Análise'
  | 'Pendente de Aprovação'
  | 'Devolvido' 
  | 'Devolvida'
  | 'Aprovada' 
  | 'Reprovada' 
  | 'Concluído' 
  | 'Concluída' 
  | 'Cancelado'
  | 'Cancelada';

export type RequestOrigin = 'manual' | 'esteira-sugestao' | 'esteira-automatico';
export type SlaStatus = 'normal' | 'warning' | 'critical';

export type FieldOrigin = 'F' | 'C' | 'K';
export type FieldType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime'
  | 'select' 
  | 'multiselect'
  | 'boolean' 
  | 'toggle'
  | 'checkbox'
  | 'file' 
  | 'currency' 
  | 'percent' 
  | 'textarea' 
  | 'checklist' 
  | 'dependent-list' 
  | 'radio' 
  | 'zoom'
  | 'signature'
  | 'calc'
  | 'grid'
  | 'repeater'
  | 'status'
  | 'info'
  | 'section';

export interface FormField {
  id?: string;
  name?: string;
  label: string;
  type: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  defaultValue?: any;
  origin?: 'F' | 'C' | 'K';
  validation?: any;
  columns?: any[];
  options?: any[];
  source?: string;
  multiple?: boolean;
  zoomConfig?: {
    entity: string;
    fields: string[];
  };
  section?: string;
  gridCols?: number;
  calculate?: (data: any) => any;
  condition?: (data: any) => boolean;
}

export interface FormSection {
  id?: string;
  title?: string;
  name?: string; // used as alias for title in some definitions
  fields: FormField[];
}

export interface ProcessDefinition {
  processId: string;
  targetMode?: TargetMode;
  steps: FormSection[];
}

export interface HistoryEntry {
  id: string;
  userName?: string;
  userId?: string;
  step?: string;
  action?: string;
  timestamp?: string;
  comments?: string;
  // Legacy support
  autor?: string;
  etapa?: string;
  dataHora?: string;
  de?: string;
  para?: string;
  comentario?: string;
  motivo?: string;
}

export interface RHRequest {
  id: string;
  numero: string;
  processId?: string;
  processName?: string;
  category?: string;
  status: RequestStatus;
  solicitante: string;
  requesterId?: string;
  requesterSnapshot?: {
    avatar?: string;
    name: string;
    registration: string;
    email: string;
    role: string;
    department: string;
    costCenter: string;
    branch: string;
    requestedAt?: string;
  };
  requestedAt?: string;
  colaborador?: string;
  employeeId?: string;
  createdAt: string;
  updatedAt?: string;
  currentStep?: string;
  responsibleGroup?: string;
  data: Record<string, any>;
  history?: HistoryEntry[];
  attachments?: string[];
  priority?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  isDraft?: boolean;
  // Legacy support fields for existing UI components
  tipoProcesso?: string;
  alvo?: string;
  alvoId?: string;
  origem?: RequestOrigin;
  etapaAtual?: string;
  responsavelAtual?: string;
  historico?: HistoryEntry[];
  slaStatus?: SlaStatus;
  empresa?: string;
  filial?: string;
  centroCusto?: string;
  slaVencimento?: string;
  trail?: string[];
}

export interface ProcessPermission {
  ver: boolean;
  solicitar: boolean;
  executar: boolean;
  aprovar: boolean;
  devolver: boolean;
  cancelar: boolean;
  reabrir: boolean;
  verHistorico: boolean;
  verSigiloso: boolean;
}

export interface SensitiveDataPermission {
  visualizarSalario: boolean;
  editarSalario: boolean;
  visualizarCPF: boolean;
  visualizarDocumentosPessoais: boolean;
  visualizarDadosBancarios: boolean;
  visualizarASO: boolean;
  visualizarMedidaDisciplinar: boolean;
  visualizarDesligamento: boolean;
  visualizarJuridico: boolean;
  visualizarAuditoria: boolean;
}

export interface Group {
  id: string;
  nome: string;
  setor: string;
  escopo: 'proprio' | 'equipe' | 'setor' | 'centro-custo' | 'filial' | 'empresa' | 'global';
  membros: string[]; 
  permissoes: Record<string, ProcessPermission>; 
  dadosSensiveis: SensitiveDataPermission;
}

export interface Sector {
  id: string;
  name: string;
  manager: string;
  branch: string;
}

export interface Company {
  id: string;
  name: string;
  document: string;
  logo?: string;
}

export interface CostCenter {
  id: string;
  name: string;
  code: string;
}

export interface Job {
  id: string;
  code: string;
  title: string;
  company: string;
  branch: string;
  department: string;
  sector: string;
  costCenter: string;
  location: string;
  quantity: number;
  status: 'Aberto' | 'Pausado' | 'Preenchido' | 'Cancelado';
  type: 'CLT' | 'PJ' | 'Estágio';
  salaryRange?: string;
  description?: string;
  requirements?: string[];
  requestId?: string;
  createdAt: string;
}

export interface Application {
  id: string;
  jobId: string;
  candidateName: string;
  email: string;
  phone: string;
  status: 'Triagem' | 'Entrevista RH' | 'Entrevista Gestor' | 'Teste Técnico' | 'Proposta' | 'Aprovado' | 'Contratado' | 'Recusado' | 'Em Análise' | 'Entrevista Técnica';
  source: string;
  resumeUrl?: string;
  score?: number;
  appliedAt: string;
  createdAt?: string;
  notes?: string;
}

export interface OnboardingTask {
  id: string;
  task: string;
  owner: string;
  done: boolean;
  date?: string;
  observation?: string;
  evidence?: string;
}

export interface OnboardingData {
  rh: OnboardingTask[];
  ti: OnboardingTask[];
  facilities: OnboardingTask[];
  gestor: OnboardingTask[];
  colaborador: OnboardingTask[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string; 
  dueDate: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluída' | 'Atrasada';
  priority: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  relatedRequestId?: string;
  createdAt: string;
  requestId?: string;
  requestNumber?: string;
  processId?: string;
  process?: string;
  solicitante?: string;
  responsible?: string;
  responsibleUserId?: string;
  responsibleGroupId?: string;
  type?: string;
  prazo?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: 'Geral' | 'RH' | 'Evento' | 'TI';
  priority: 'Normal' | 'Importante' | 'Urgente';
}

export interface BenefitConfig {
  id: string;
  name: string;
  provider: string;
  type: 'Saúde' | 'Refeição' | 'Seguro' | 'Alimentação' | 'Auxílio' | 'Outros';
  active: boolean;
  cost?: number;
}

export interface Integration {
  id: string;
  name: string;
  status: 'Conectado' | 'Desconectado' | 'Erro';
  lastSync?: string;
  type: 'ERP' | 'Banco' | 'Ponto' | 'Benefícios' | 'Outros';
}

export interface IntegrationLog {
  id: string;
  integrationId: string;
  timestamp: string;
  action: string;
  status: 'Sucesso' | 'Erro';
  message: string;
}

export interface Notificacao {
  id: string;
  userId: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
  dataHora: string;
  link?: string;
  tipo: 'solicitacao' | 'tarefa' | 'aprovacao' | 'sistema';
}

export interface AppConfig {
  version: string;
  empresaAtual: Company;
  usuarioAtual: User;
  usuariosDemo: User[];
  accessos: Accesso[];
  currentAccessId?: string | null;
  originalUserId?: string | null;
  originalUser?: User | null;
  empresas: Company[];
  filiais: string[];
  unidades: Unit[];
  sindicatos: Union[];
  faixasSalariais: SalaryBand[];
  centrosDeCusto: CostCenter[];
  setores: Sector[];
  grupos: Group[];
  cargos: string[];
  modulos: { id: string; label: string; ativo: boolean }[];
  processos: RHProcess[];
  processDefinitions: Record<string, ProcessDefinition>;
  intranet: IntranetItem[];
  solicitacoes: RHRequest[];
  colaboradores: Employee[];
  vagas: Job[];
  candidaturas: Application[];
  tarefas: Task[];
  comunicados: Announcement[];
  beneficios: BenefitConfig[];
  integracoes: Integration[];
  integracaoLogs: IntegrationLog[];
  notificacoes: Notificacao[];
  requestCounter: number;
  isNewRequestModalOpen?: boolean;
  currentRequestId?: string | null;
  highlightedRequestNumber?: string | null;
  selectedEmployeeId?: string | null;
  appName?: string;
  primaryColor?: string;
  activeView: string;
  aiGlobalEnabled: boolean;
  auditTrail: AuditLog[];
}
