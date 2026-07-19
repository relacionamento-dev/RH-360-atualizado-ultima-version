const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Replace admin-plans, admin-templates placeholders with actual components if they don't exist,
// or just route them to AdminModule for simplicity if we can. 
// We will just create a new component `SettingsModule` or keep using `AdminModule`.

// Add PortalExternal route
code = code.replace(/case 'login': return <Login onLogin=\{\(\) => handleNavigate\('dashboard'\)\} \/>;/, `case 'login': return <Login onLogin={() => handleNavigate('dashboard')} onPortalLogin={() => handleNavigate('portal-external-home')} />;
      case 'portal-external-login': return <PortalExternalLogin onLogin={() => handleNavigate('portal-external-home')} />;
      case 'portal-external-home':
      case 'portal-external-proposals':
      case 'portal-external-docs':
      case 'portal-external-tickets':
      case 'portal-external-tracking':
      case 'portal-external-account':
        return <PortalExternal view={currentView} onNavigate={handleNavigate} />;`);

code = code.replace(/import Login from '\.\/components\/Login';/, `import Login from './components/Login';
import PortalExternal, { PortalExternalLogin } from './components/PortalExternal';`);

// Update the case statements in renderView
code = code.replace(/case 'portal': return <PortalModule onNavigate=\{handleNavigate\} projects=\{projects\} customer=\{customers\[0\]\} \/>;/, `case 'portal':
      case 'portal-tracking':
      case 'portal-docs':
      case 'portal-tickets':
        return <PortalModule onNavigate={handleNavigate} view={currentView} projects={projects} />;`);

code = code.replace(/case 'admin': return <AdminModule onNavigate=\{handleNavigate\} activeModules=\{activeModules\} onToggleModule=\{handleToggleModule\} \/>;/, `case 'admin': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view={currentView} />;
      case 'admin-plans': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-plans" />;
      case 'admin-templates': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-templates" />;`);

code = code.replace(/case 'ai': return <AiModule onNavigate=\{handleNavigate\} \/>;/, `case 'ai':
      case 'ai-invoice':
      case 'ai-access':
      case 'ai-nf':
      case 'ai-review':
        return <AiModule onNavigate={handleNavigate} view={currentView} />;`);

code = code.replace(/case 'integrations': return <IntegrationsModule onNavigate=\{handleNavigate\} \/>;/, `case 'integrations':
      case 'integrations-whatsapp':
      case 'integrations-esign':
      case 'integrations-inverters':
      case 'integrations-distributors':
      case 'integrations-logs':
        return <IntegrationsModule onNavigate={handleNavigate} view={currentView} />;`);


fs.writeFileSync('src/App.tsx', code);
