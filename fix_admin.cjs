const fs = require('fs');
let code = fs.readFileSync('src/components/AdminModule.tsx', 'utf8');

code = code.replace(/activeModules: Record<string, boolean>;/, 'activeModules: string[];');

code = code.replace(/activeModules\[mod\.id\] \!== false/g, 'activeModules.includes(mod.id)');

fs.writeFileSync('src/components/AdminModule.tsx', code);
