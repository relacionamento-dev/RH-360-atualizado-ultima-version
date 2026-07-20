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
import RequestDetail from './components/RequestDetail';
import RHRequestForm from './components/RHRequestForm';
import { AppConfigProvider, useAppConfig } from './contexts/AppConfigContext';

function AppContent() {
  const { config, updateConfig, login } = useAppConfig();
  const currentView = config.activeView;

  const handleNavigate = (view: string, id?: string) => {
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
      case 'global-query':
      case 'consultation': return <GlobalQuery />;
      case 'admin':
      case 'configuracoes': return <AdminModule view={currentView} />;
      case 'integrations': return <AdminModule view={currentView} />;
      case 'access-management': return <AccessManagement />;
      
      // Handle process-specific navigation
      default: 
        if (currentView.startsWith('hr-proc-')) {
          return <RHRequests initialTab="hub" initialProcessId={currentView.split('-').pop()} />;
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
