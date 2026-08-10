/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Dashboard from './components/Dashboard';
import Login from './components/Login';
import AppShell from './components/AppShell';
import RHRequests from './components/RHRequests';
import IntranetModule from './components/IntranetModule';
import ReportsModule from './components/ReportsModule';
import TaskCenterModule from './components/TaskCenterModule';
import EmployeesModule from './components/EmployeesModule';
import Profile360Module from './components/Profile360Module';
import GlobalQuery from './components/GlobalQuery';
import AdminModule from './components/AdminModule';
import AccessManagement from './components/AccessManagement';
import PortalColaboradorModule from './components/admissao-digital/PortalColaboradorModule';
import RequestDetail from './components/RequestDetail';
import RHRequestForm from './components/RHRequestForm';
import DesligamentoEncerramento from './components/desligamento/DesligamentoEncerramento';
import { AppConfigProvider, useAppConfig } from './contexts/AppConfigContext';

/**
 * Apelidos de rota antigos → rota canônica.
 *
 * Vários pontos do app navegam pelo nome em português ('solicitacoes') enquanto
 * o menu lateral registra o item pelo nome canônico ('requests'). Como o
 * destaque do menu é uma comparação direta com `activeView`, voltar de um
 * detalhe de solicitação deixava a tela certa na frente e NENHUM item aceso no
 * menu. Normalizar aqui resolve para todos os chamadores de uma vez.
 */
const ROTAS_CANONICAS: Record<string, string> = {
  solicitacoes: 'requests',
  processos: 'hr-processes',
  consultation: 'global-query',
  colaboradores: 'employees',
  relatorios: 'reports'
};

function AppContent() {
  const { config, updateConfig, login } = useAppConfig();
  const currentView = config.activeView;

  const handleNavigate = (viewSolicitada: string, id?: string) => {
    const view = ROTAS_CANONICAS[viewSolicitada] || viewSolicitada;
    if (view === 'new-request' || view === 'solicitacoes/nova') {
      updateConfig({ activeView: 'request-form', currentRequestId: id || null });
      return;
    }

    if (view === 'request-detail' || view === 'solicitacoes/detalhe') {
      updateConfig({ activeView: 'request-detail', currentRequestId: id || null });
      return;
    }

    if (view === 'request-edit' || view === 'solicitacoes/editar') {
      updateConfig({ activeView: 'request-form', currentRequestId: id || null });
      return;
    }

    if (id) {
      if (view === 'profile-360') {
        updateConfig({ selectedEmployeeId: id, activeView: 'profile-360' });
        return;
      }
      
      if (view === 'processos' || view === 'hr-processes') {
         updateConfig({ activeView: `hr-proc-${id}` });
         return;
      }
    }
    
    updateConfig({ activeView: view });
  };

  const renderView = () => {
    if (currentView === 'login') {
      return <Login onLogin={login} />;
    }

    if (currentView === 'request-form') {
      return <RHRequestForm requestId={config.currentRequestId} onBack={() => handleNavigate('solicitacoes')} />;
    }

    if (currentView === 'request-detail') {
      return <RequestDetail requestId={config.currentRequestId || ''} onBack={() => handleNavigate('solicitacoes')} />;
    }

    // Desligamento: etapa do RH/DP depois da aprovação final. Volta para o
    // detalhe da própria solicitação, que é de onde ela é aberta.
    if (currentView === 'desligamento-encerramento') {
      return (
        <DesligamentoEncerramento
          requestId={config.currentRequestId || ''}
          onBack={() => handleNavigate('request-detail', config.currentRequestId || undefined)}
        />
      );
    }

    switch (currentView) {
      case 'dashboard': return <Dashboard onNavigate={handleNavigate} />;
      case 'processos':
      case 'hr-processes': return <RHRequests initialTab="hub" />;
      case 'reports':
      case 'relatorios': return <ReportsModule />;
      case 'intranet': return <IntranetModule onNavigate={handleNavigate} />;
      case 'tasks': return <TaskCenterModule />;
      case 'requests':
      case 'solicitacoes': return <RHRequests initialTab="mine" />;
      case 'approvals': return <RHRequests initialTab="approvals" />;
      case 'employees':
      case 'colaboradores': return <EmployeesModule onNavigate={handleNavigate} />;
      case 'profile-360': return <Profile360Module employeeId={config.selectedEmployeeId || undefined} />;
      case 'portal-colaborador': return <PortalColaboradorModule />;
      case 'global-query':
      case 'consultation': return <GlobalQuery />;
      // Central Adm: 'admin'/'configuracoes' entram na Visão Geral e cada aba
      // tem a própria rota ('admin-perfis', 'admin-org'…), tratada no default.
      // 'integrations' tem item de menu próprio e abre direto naquela aba.
      case 'admin':
      case 'configuracoes':
      case 'integrations': return <AdminModule view={currentView} />;
      case 'access-management': return <AccessManagement />;
      
      // Handle process-specific navigation
      default: 
        if (currentView.startsWith('hr-proc-')) {
          return <RHRequests initialTab="hub" initialProcessId={currentView.split('-').pop()} />;
        }
        if (currentView.startsWith('admin-')) {
          return <AdminModule view={currentView} />;
        }
        return <IntranetModule onNavigate={handleNavigate} />;
    }
  };

  if (currentView === 'login') {
    return renderView();
  }

  return (
    <AppShell 
      currentView={currentView} 
      onNavigate={handleNavigate}
    >
      {renderView()}
    </AppShell>
  );
}

export default function App() {
  return (
    <AppConfigProvider>
      <AppContent />
    </AppConfigProvider>
  );
}
