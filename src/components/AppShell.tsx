import React, { useState } from 'react';
import { 
  LayoutDashboard, Users, FileText, BarChart2, 
  Sparkles, Zap, Settings, Search, Plus, ChevronDown, ChevronRight, 
  Bell, Building2, Menu, X, ChevronLeft, MonitorSmartphone,
  CheckCircle2, Globe, Folder, LogOut, User as UserIcon, ListTodo, ClipboardList, RefreshCw, UserCircle,
  TrendingUp, UserMinus, Move, Activity, UserPlus, Palmtree, GraduationCap, Target, DollarSign, CreditCard, Clock,
  ShieldCheck, AlertCircle
} from 'lucide-react';
import { useAppConfig } from '../contexts/AppConfigContext';
import { Avatar, Modal, Badge } from './ui/Misc';
import { Button } from './ui/Button';
import { RHProcess, ProcessPermission, RHRequest, User } from '../types';
import { isSuperAdmin, podeAbrirPeloFluxoGenerico } from '../utils/permissions';
import RHRequestForm from './RHRequestForm';
import RequestDetail from './RequestDetail';

interface AppShellProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string, projectId?: string) => void;
}

type SubmenuItem = {
  label: string;
  view: string;
};

type MenuItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  view?: string;
  submenus?: SubmenuItem[];
};

type MenuGroup = {
  label: string;
  items: MenuItem[];
};

export default function AppShell({ 
  children, 
  currentView, 
  onNavigate
}: AppShellProps) {
  const { config, updateConfig, resetDemo, createRequest, isAuthorized, logout } = useAppConfig();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const searchResults = searchQuery.trim() === '' ? [] : [
    ...(config.colaboradores || []).filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase())).map(e => ({ type: 'colaborador', id: e.id, label: e.name, subtitle: e.role, icon: <Users size={14} /> })),
    ...(config.solicitacoes || []).filter(r => r.numero.toLowerCase().includes(searchQuery.toLowerCase()) || r.alvo?.toLowerCase().includes(searchQuery.toLowerCase())).map(r => ({ type: 'solicitacao', id: r.id, label: r.numero, subtitle: r.processName || r.alvo, icon: <FileText size={14} /> })),
    ...(config.processos || []).filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())).map(p => ({ type: 'processo', id: p.id, label: p.name, subtitle: p.category, icon: <Zap size={14} /> })),
    ...(config.tarefas || []).filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase())).map(t => ({ type: 'tarefa', id: t.id, label: t.title, subtitle: t.status, icon: <ListTodo size={14} /> }))
  ].slice(0, 8);

  const handleSearchResultClick = (result: any) => {
    setSearchQuery('');
    setShowSearchResults(false);
    if (result.type === 'colaborador') {
      updateConfig({ selectedEmployeeId: result.id });
      onNavigate('profile-360');
    } else if (result.type === 'solicitacao') {
      updateConfig({ currentRequestId: result.id });
    } else if (result.type === 'processo') {
      const process = config.processos.find(p => p.id === result.id);
      if (process) {
        setSelectedProcess(process);
        setIsRequestFormOpen(true);
      }
    } else if (result.type === 'tarefa') {
      onNavigate('tasks');
    }
  };
  const [selectedProcess, setSelectedProcess] = useState<RHProcess | null>(null);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  const iconMap: Record<string, any> = {
    'UserPlus': <UserPlus />,
    'Search': <Search />,
    'CheckCircle2': <CheckCircle2 />,
    'Flag': <ListTodo />,
    'Palmtree': <Palmtree />,
    'TrendingUp': <TrendingUp />,
    'Move': <Move />,
    'Activity': <Activity />,
    'UserMinus': <UserMinus />,
    'GraduationCap': <GraduationCap />,
    'Target': <Target />,
    'DollarSign': <DollarSign />,
    'CreditCard': <CreditCard />,
    'Users': <Users />,
    'Clock': <Clock />,
  };

  const userProfile = config.usuarioAtual.profile;
  // Administrador Geral vê todos os menus. Vale para o usuário efetivo: ao
  // "Visualizar como", `usuarioAtual` é o perfil simulado e o menu encolhe
  // conforme as regras dele.
  const hasFullAccess = isSuperAdmin(config.usuarioAtual);
  const realUser = config.originalUser || config.usuarioAtual;
  const realUserProfile = realUser.profile;
  const isImpersonating = !!config.originalUser;
  const originalUser = config.originalUser;

  const profileRepresentatives: Record<string, string> = {
    'Administrador Geral': 'ADMIN-GERAL-001',
    'Administrador': 'ADMIN-001',
    'Diretoria': 'DIR-002',
    'RH/DP': 'RH-001',
    'Gestor': 'GEST-001',
    'Colaborador': 'COLAB-001'
  };

  const impersonationOptions = (realUserProfile === 'Administrador Geral' || realUserProfile === 'Administrador')
    ? ['Administrador Geral', 'Administrador', 'Diretoria', 'RH/DP', 'Gestor', 'Colaborador']
        .filter(profile => {
          if (realUserProfile === 'Administrador') {
            return profile !== 'Administrador Geral';
          }
          return true;
        })
        .map(profile => {
          const representative = config.usuariosDemo.find(user => user.id === profileRepresentatives[profile]) || config.usuariosDemo.find(user => user.profile === profile);
          return {
            profile: profile as User['profile'],
            representative: representative || { id: `rep-${profile}`, name: profile, role: profile, groups: [], profile: profile as User['profile'], scope: 'empresa', email: '', status: 'Ativo' }
          };
        })
    : [];

  const menuGroups: MenuGroup[] = [
    {
      label: 'PRINCIPAL',
      items: [
        { 
          id: 'intranet', 
          label: 'Intranet', 
          icon: <Globe className="w-5 h-5" />, 
          view: 'intranet'
        },
        { 
          id: 'dashboard', 
          label: 'Dashboard RH', 
          icon: <LayoutDashboard className="w-5 h-5" />, 
          view: 'dashboard'
        }
      ].filter(item => {
        if (hasFullAccess) return true;
        if (userProfile === 'Colaborador') return item.id === 'intranet';
        return true;
      })
    },
    {
      label: 'MEU DIA A DIA',
      items: [
        { 
          id: 'tasks', 
          label: 'Central de Tarefas', 
          icon: <ListTodo className="w-5 h-5" />, 
          view: 'tasks'
        },
        { 
          id: 'requests', 
          label: 'Minhas Solicitações', 
          icon: <FileText className="w-5 h-5" />, 
          view: 'requests'
        },
        { 
          id: 'approvals', 
          label: 'Minhas Aprovações', 
          icon: <CheckCircle2 className="w-5 h-5" />, 
          view: 'approvals'
        }
      ].filter(item => {
        if (hasFullAccess) return true;
        if (userProfile === 'Colaborador') return item.id === 'requests';
        return true;
      })
    },
    {
      label: 'PESSOAS',
      items: [
        { 
          id: 'employees', 
          label: 'Colaboradores', 
          icon: <Users className="w-5 h-5" />, 
          view: 'employees'
        },
        {
          id: 'profile-360',
          label: 'Perfil 360',
          icon: <UserIcon className="w-5 h-5" />,
          view: 'profile-360'
        },
        {
          id: 'portal-colaborador',
          label: 'Portal do Colaborador',
          icon: <MonitorSmartphone className="w-5 h-5" />,
          view: 'portal-colaborador'
        }
      ].filter(item => {
        if (hasFullAccess) return true;
        if (['Administrador', 'RH/DP'].includes(userProfile)) return true;
        if (userProfile === 'Gestor' && item.id === 'profile-360') return true;
        return false;
      })
    },
    {
      label: 'PROCESSOS DE RH',
      items: [
        { 
          id: 'hr-processes', 
          label: 'Hub de Processos', 
          icon: <ClipboardList className="w-5 h-5" />, 
          view: 'hr-processes',
          submenus: (config.processos || [])
            .filter(p => p.ativo)
            .map(p => ({ label: p.name, view: `hr-proc-${p.id}` }))
        },
        {
          id: 'global-query',
          label: 'Consulta Global',
          icon: <Search className="w-5 h-5" />,
          view: 'global-query'
        }
      ].filter(item => {
        if (hasFullAccess) return true;
        if (userProfile === 'Colaborador') return false;
        if (userProfile === 'Gestor') return item.id === 'hr-processes';
        return true;
      })
    },
    {
      label: 'GESTÃO',
      items: [
        { 
          id: 'reports', 
          label: 'Relatórios', 
          icon: <BarChart2 className="w-5 h-5" />, 
          view: 'reports'
        },
        { 
          id: 'integrations', 
          label: 'Integrações', 
          icon: <Zap className="w-5 h-5" />, 
          view: 'integrations'
        },
        { 
          id: 'admin', 
          label: 'Central Adm', 
          icon: <Settings className="w-5 h-5" />, 
          view: 'admin'
        },
        {
          id: 'access-management',
          label: 'Gestão de Acessos',
          icon: <ShieldCheck className="w-5 h-5" />,
          view: 'access-management'
        }
      ].filter(item => {
        if (hasFullAccess) return true;
        if (item.id === 'access-management') {
          return config.usuarioAtual.canManageAccesses === true;
        }
        if (item.id === 'admin') {
          return userProfile === 'Administrador';
        }
        if (item.id === 'integrations') {
          return userProfile === 'Administrador';
        }
        if (item.id === 'reports') {
          return ['Administrador', 'Diretoria', 'RH/DP'].includes(userProfile);
        }
        return false;
      })
    }
  ].filter(group => group.items.length > 0);

  const toggleMenu = (id: string) => {
    setExpandedMenu(prev => prev === id ? null : id);
  };

  const isActive = (item: MenuItem) => {
    if (item.view === config.activeView) return true;
    if (item.submenus?.some(sub => sub.view === config.activeView)) return true;
    return false;
  };

  const switchUser = (user: User) => {
    if (isImpersonating && originalUser) {
      updateConfig({ originalUser, originalUserId: originalUser.id, usuarioAtual: user, activeView: 'intranet' });
    } else if (!isImpersonating && (realUserProfile === 'Administrador Geral' || realUserProfile === 'Administrador')) {
      updateConfig({ originalUser: realUser, originalUserId: realUser.id, usuarioAtual: user, activeView: 'intranet' });
    } else {
      updateConfig({ usuarioAtual: user, originalUser: null, originalUserId: null, activeView: 'intranet' });
    }
    setShowUserMenu(false);
  };

  const revertImpersonation = () => {
    if (originalUser) {
      updateConfig({ usuarioAtual: originalUser, originalUser: null, originalUserId: null, activeView: 'intranet' });
    }
    setShowUserMenu(false);
  };

  React.useEffect(() => {
    // Expand submenu if the current view is a process under Hub
    if (config.activeView.startsWith('hr-proc-')) {
      setExpandedMenu('hr-processes');
    }
  }, [config.activeView]);

  const currentAccess = config.currentAccessId ? config.accessos.find(a => a.id === config.currentAccessId) : undefined;
  const currentAccessExpiration = currentAccess ? new Date(currentAccess.expirationDate) : null;
  const daysRemaining = currentAccess && currentAccessExpiration ? Math.ceil((currentAccessExpiration.getTime() - Date.now()) / 86400000) : null;
  const showAccessWarning = currentAccess && !currentAccess.blocked && currentAccessExpiration && currentAccessExpiration > new Date() && daysRemaining !== null && daysRemaining <= 2;
  const accessWarningMessage = showAccessWarning ? `Seu acesso expira em ${daysRemaining} dia${daysRemaining === 1 ? '' : 's'}.` : null;

  const isFullScreen = currentView === 'request-form' || currentView === 'request-detail';

  if (isFullScreen) {
    return <div className="h-screen bg-[var(--color-brand-bg)]">{children}</div>;
  }

  return (
    <div className="flex h-screen bg-[var(--color-brand-bg)] overflow-hidden">
      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[70] lg:hidden animate-in fade-in duration-300" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`bg-white border-r border-[var(--color-brand-border)] flex flex-col shrink-0 transition-all duration-300 fixed inset-y-0 left-0 z-[80] lg:relative lg:translate-x-0 ${
          isSidebarCollapsed ? 'w-20' : 'w-72'
        } ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="p-6 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center gap-3">
              <LogoIcon />
              <span className="font-bold text-xl tracking-tight text-[var(--color-brand-text-primary)]">RH<span className="text-[var(--color-brand-primary)]">360</span></span>
            </div>
          )}
          {isSidebarCollapsed && <div className="mx-auto"><LogoIcon /></div>}
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 bg-white border border-[var(--color-brand-border)] rounded-full flex items-center justify-center text-gray-400 hover:text-[var(--color-brand-primary)] shadow-sm z-30"
          >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {menuGroups.map((group, idx) => (
            <div key={idx} className="space-y-1">
              {!isSidebarCollapsed && (
                <p className="px-3 label-caps mb-2 opacity-60">
                  {group.label}
                </p>
              )}
              {group.items.map((item) => {
                const active = isActive(item);
                const expanded = expandedMenu === item.id;

                return (
                  <div key={item.id} className="space-y-1">
                  <button 
                    key={item.id} 
                    onClick={() => {
                      if (isSidebarCollapsed) setIsSidebarCollapsed(false);
                      if (item.submenus) toggleMenu(item.id);
                      if (item.view) {
                        onNavigate(item.view);
                        setIsMobileMenuOpen(false);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[6px] transition-all duration-200 group relative ${
                      active 
                        ? 'bg-orange-50 text-[var(--color-brand-primary)]' 
                        : 'text-[var(--color-brand-text-secondary)] hover:bg-gray-50'
                    }`}
                  >
                      {active && !isSidebarCollapsed && (
                        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[var(--color-brand-primary)] rounded-r-full"></div>
                      )}
                      <div className={`${active ? 'text-[var(--color-brand-primary)]' : 'text-gray-400 group-hover:text-gray-600'} transition-colors shrink-0`}>
                        {item.icon}
                      </div>
                      {!isSidebarCollapsed && (
                        <>
                          <span className="text-[14px] font-semibold flex-1 text-left">{item.label}</span>
                          {item.submenus && (
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
                          )}
                        </>
                      )}
                    </button>
                    
                    {!isSidebarCollapsed && item.submenus && expanded && (
                      <div className="ml-9 space-y-1 animate-in slide-in-from-top-2 duration-200 border-l border-[var(--color-brand-border)] pl-1">
                        {item.submenus.map((sub, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              onNavigate(sub.view);
                              setIsMobileMenuOpen(false);
                            }}
                            className={`w-full text-left py-2 px-3 text-[13px] font-medium rounded-[4px] transition-colors ${
                              config.activeView === sub.view 
                                ? 'text-[var(--color-brand-primary)] bg-orange-50/50' 
                                : 'text-[var(--color-brand-text-secondary)] hover:text-[var(--color-brand-text-primary)] hover:bg-gray-50'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[var(--color-brand-border)]">
          {!isSidebarCollapsed ? (
            <div className="bg-gray-50 rounded-[12px] p-4">
              <div className="flex items-center gap-3 mb-3">
                <Avatar name={config.usuarioAtual.name} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-[var(--color-brand-text-primary)] truncate">{config.usuarioAtual.name}</p>
                  <p className="text-[11px] font-medium text-gray-500 truncate">{config.usuarioAtual.role}</p>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button 
                  onClick={resetDemo}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-[11px] font-bold text-gray-500 hover:text-orange-600 transition-colors"
                >
                  <RefreshCw size={14} />
                  Reiniciar Demo
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
               <button 
                onClick={resetDemo}
                className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                title="Reiniciar Demo"
              >
                <RefreshCw size={20} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Topbar */}
        <header className="h-16 bg-white border-b border-[var(--color-brand-border)] flex items-center justify-between px-4 lg:px-8 shrink-0 z-[60] sticky top-0">
          <div className="flex items-center gap-4 lg:hidden mr-4">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <LogoIcon />
              <span className="font-bold text-lg tracking-tight text-[var(--color-brand-text-primary)]">RH<span className="text-[var(--color-brand-primary)]">360</span></span>
            </div>
          </div>

          <div className="flex-1 max-w-xl relative hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por colaborador, processo ou solicitação..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="block w-full pl-10 pr-12 py-2 bg-[var(--color-brand-bg)] border border-[var(--color-brand-border)] rounded-[6px] text-[14px] focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-[var(--color-brand-primary)] transition-all" 
            />

            {showSearchResults && searchQuery.trim() !== '' && (
              <>
                <div className="fixed inset-0 z-[55]" onClick={() => setShowSearchResults(false)} />
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-[12px] shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-2 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Resultados da Busca</span>
                    <button onClick={() => setShowSearchResults(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={14} /></button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {searchResults.length > 0 ? (
                      searchResults.map((result, idx) => (
                        <button
                          key={`${result.type}-${result.id}-${idx}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="w-full flex items-center gap-4 p-3 hover:bg-orange-50 transition-colors text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white group-hover:text-orange-500 transition-colors shadow-sm">
                            {result.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-black text-gray-900 truncate">{result.label}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{result.subtitle}</p>
                              <span className="text-gray-300">•</span>
                              <p className="text-[10px] text-orange-600 font-black uppercase tracking-tight">{result.type}</p>
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-gray-300 group-hover:text-orange-500 transition-colors" />
                        </button>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Search size={24} className="mx-auto text-gray-200 mb-2" />
                        <p className="text-[13px] font-bold text-gray-400">Nenhum resultado encontrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-6">
            <Button 
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => updateConfig({ isNewRequestModalOpen: true })}
              className="font-bold tracking-tight"
            >
              NOVA SOLICITAÇÃO
            </Button>
            
            <div className="h-8 w-px bg-[var(--color-brand-border)] hidden sm:block" />

            <div className="flex items-center gap-3 group text-left">
              <div className="text-right hidden sm:block leading-tight">
                <p className="label-caps opacity-60">Empresa</p>
                <p className="text-[13px] font-bold text-[var(--color-brand-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">{config.empresaAtual.name}</p>
              </div>
              <div className="w-10 h-10 bg-[var(--color-brand-bg)] rounded-[6px] flex items-center justify-center text-gray-400 hairline-border group-hover:bg-orange-50 group-hover:text-[var(--color-brand-primary)] transition-all">
                <Building2 size={20} />
              </div>
            </div>

            <div className="relative">
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 pl-4 border-l border-[var(--color-brand-border)] group text-left"
              >
                <div className="text-right hidden sm:block leading-tight">
                  <p className="text-[13px] font-bold text-[var(--color-brand-text-primary)] group-hover:text-[var(--color-brand-primary)] transition-colors">{config.usuarioAtual.name}</p>
                  <p className="label-caps text-[var(--color-brand-primary)]">{config.usuarioAtual.role}</p>
                </div>
                <Avatar src={config.usuarioAtual.avatar} name={config.usuarioAtual.name} className="ring-2 ring-[var(--color-brand-primary)]/10 ring-offset-2" />
              </button>

              {showUserMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-[var(--color-brand-border)] rounded-[8px] shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-1">
                      <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Perfil Atual</div>
                      <div className="px-3 py-2 bg-orange-50/50 rounded-md mx-1 mb-2">
                        <div className="text-[13px] font-bold text-gray-900">{config.usuarioAtual.name}</div>
                        <div className="text-[11px] font-medium text-[var(--color-brand-primary)] uppercase">{config.usuarioAtual.role}</div>
                      </div>

                      {impersonationOptions.length > 0 && (
                        <>
                          <div className="h-px bg-[var(--color-brand-border)] my-1 mx-1" />
                          <div className="px-3 py-2 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Visualizar como</div>
                        </>
                      )}
                      <div className="max-h-72 overflow-y-auto custom-scrollbar px-1 space-y-1">
                        {impersonationOptions.map(option => (
                          <button 
                            key={option.profile}
                            onClick={() => switchUser(option.representative)}
                            className={`w-full text-left p-3 rounded-[8px] transition-colors border ${config.usuarioAtual.profile === option.profile ? 'border-orange-200 bg-orange-50' : 'border-transparent hover:border-gray-200 hover:bg-gray-50'}`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[13px] font-black text-gray-900">{option.profile}</p>
                                <p className="text-[11px] text-gray-500">{option.representative.name}</p>
                              </div>
                              <Avatar src={option.representative.avatar} name={option.representative.name} size="xs" />
                            </div>
                          </button>
                        ))}
                      </div>

                      {isImpersonating && originalUser && (
                        <>
                          <div className="h-px bg-[var(--color-brand-border)] my-1 mx-1" />
                          <button onClick={() => { revertImpersonation(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-[4px] transition-colors text-left">
                            <UserIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-[14px] font-medium text-gray-700">Voltar ao meu perfil</span>
                          </button>
                        </>
                      )}
                      <div className="h-px bg-[var(--color-brand-border)] my-1 mx-1" />
                      <button onClick={() => { onNavigate('profile-360'); setShowUserMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-[4px] transition-colors text-left">
                        <UserIcon className="w-4 h-4 text-gray-400" />
                        <span className="text-[14px] font-medium text-gray-700">Meu perfil</span>
                      </button>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 text-red-600 rounded-[4px] transition-colors text-left">
                        <LogOut className="w-4 h-4" />
                        <span className="text-[14px] font-medium">Sair</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 transition-colors relative rounded-[6px] ${showNotifications ? 'text-[var(--color-brand-primary)] bg-orange-50' : 'text-gray-400 hover:text-gray-900'}`}
              >
                <Bell size={20} />
                {(config.notificacoes || []).filter(n => !n.lida).length > 0 && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-[var(--color-brand-primary)] border-2 border-white rounded-full"></div>
                )}
              </button>

              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-[55]" onClick={() => setShowNotifications(false)} />
                  <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-gray-100 rounded-[12px] shadow-2xl z-[60] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                      <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Notificações</span>
                      <Badge variant="blue" size="sm">{(config.notificacoes || []).filter(n => !n.lida).length} NOVAS</Badge>
                    </div>
                    <div className="max-h-[400px] overflow-y-auto">
                      {(config.notificacoes || []).length > 0 ? (
                        config.notificacoes.map((notif) => (
                          <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer">
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${notif.lida ? 'bg-gray-200' : 'bg-orange-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-black text-gray-900 leading-tight">{notif.titulo}</p>
                                <p className="text-[12px] text-gray-500 mt-1 line-clamp-2">{notif.mensagem}</p>
                                <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-tight">{new Date(notif.dataHora).toLocaleString('pt-BR')}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <Bell size={24} className="mx-auto text-gray-200 mb-2" />
                          <p className="text-[13px] font-bold text-gray-400">Nenhuma notificação</p>
                        </div>
                      )}
                    </div>
                    <div className="p-2 bg-gray-50 border-t border-gray-100">
                      <button className="w-full py-2 text-[11px] font-black text-orange-600 uppercase tracking-widest hover:bg-orange-100 rounded-lg transition-colors">Marcar todas como lidas</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth bg-[var(--color-brand-bg)]">
          <div className="p-8 max-w-[1600px] mx-auto min-h-full pb-20">
            {accessWarningMessage && (
              <div className="mb-6 rounded-[18px] border border-orange-200 bg-orange-50 p-4 text-orange-900 text-sm font-bold flex items-center gap-3">
                <AlertCircle size={18} />
                {accessWarningMessage}
              </div>
            )}
            {isImpersonating && originalUser && (
              <div className="sticky top-16 z-50 mb-6 rounded-[18px] border border-slate-200 bg-slate-50 p-4 text-slate-900 text-sm font-bold flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                <span>Visualizando como <strong>{config.usuarioAtual.name} — {config.usuarioAtual.profile}</strong></span>
                <Button variant="secondary" size="sm" onClick={revertImpersonation}>Voltar ao meu perfil</Button>
              </div>
            )}
            {children}
          </div>
        </main>
      </div>

      {/* Global New Request Modal */}
      <Modal 
        isOpen={!!config.isNewRequestModalOpen} 
        onClose={() => updateConfig({ isNewRequestModalOpen: false })} 
        title="Nova Solicitação"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2">
          {(config.processos || []).filter(p => p.ativo && isAuthorized(p.id, 'solicitar') && podeAbrirPeloFluxoGenerico(p.id)).map(process => (
            <button
              key={process.id}
              className="flex items-start gap-4 p-4 bg-gray-50 rounded-[12px] border border-[var(--color-brand-border)] hover:bg-white hover:border-[var(--color-brand-primary)] hover:shadow-md transition-all text-left group"
              onClick={() => {
                updateConfig({ 
                  isNewRequestModalOpen: false, 
                  activeView: 'request-form', 
                  currentRequestId: process.id 
                });
              }}
            >
              <div className="p-3 bg-white rounded-[8px] shadow-sm text-gray-400 group-hover:text-[var(--color-brand-primary)] transition-colors">
                {React.cloneElement(iconMap[process.icon] || <ClipboardList />, { className: 'w-6 h-6' })}
              </div>
              <div>
                <p className="font-bold text-gray-900 leading-tight">{process.name}</p>
                <p className="text-[12px] text-gray-500 mt-1">{process.description}</p>
              </div>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <path d="M16 2L16 9" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M16 23L16 30" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M26 16L30 16" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M2 16L9 16" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 8L19.5 12.5" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12.5 19.5L8 24" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M24 24L19.5 19.5" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M12.5 12.5L8 8" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  );
}
