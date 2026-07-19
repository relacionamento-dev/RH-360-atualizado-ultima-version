const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/case 'admin-company': return <CompanyConfig \/>;/g, `case 'admin-company': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-company" />;`);
code = code.replace(/case 'admin-users': return <UsersConfig \/>;/g, `case 'admin-users': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-users" />;`);
code = code.replace(/case 'admin-discounts': return <DiscountConfig \/>;/g, `case 'admin-discounts': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-discounts" />;`);
code = code.replace(/case 'admin-tables': return <TablesConfig \/>;/g, `case 'admin-tables': return <AdminModule onNavigate={handleNavigate} activeModules={activeModules} onToggleModule={handleToggleModule} view="admin-tables" />;`);

fs.writeFileSync('src/App.tsx', code);
