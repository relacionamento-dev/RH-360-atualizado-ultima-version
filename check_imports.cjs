const fs = require('fs');
const path = require('path');

const filesToCheck = [
  path.join(__dirname, 'src', 'App.tsx'),
  path.join(__dirname, 'src', 'main.tsx')
];

for (const file of filesToCheck) {
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  
  const tags = [...content.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
  const uniqueTags = [...new Set(tags)];
  
  const declared = new Set();
  
  const importMatches = [...content.matchAll(/import\s+{([^}]+)}/g)];
  for (const m of importMatches) {
    m[1].split(',').forEach(part => {
      const p = part.trim();
      if (p.includes(' as ')) {
        declared.add(p.split(' as ')[1].trim());
      } else {
        declared.add(p);
      }
    });
  }
  
  const defaultImportMatches = [...content.matchAll(/import\s+([A-Z][a-zA-Z0-9]+)\s+from/g)];
  for (const m of defaultImportMatches) {
    declared.add(m[1]);
  }
  
  const funcMatches = [...content.matchAll(/function\s+([A-Z][a-zA-Z0-9]+)/g)];
  for (const m of funcMatches) {
    declared.add(m[1]);
  }
  const constMatches = [...content.matchAll(/const\s+([A-Z][a-zA-Z0-9]+)\s*=/g)];
  for (const m of constMatches) {
    declared.add(m[1]);
  }

  for (const tag of uniqueTags) {
    if (!declared.has(tag) && tag !== 'StrictMode') { // StrictMode is usually imported but maybe handled differently
      console.log(`Potential undefined tag in ${file}: <${tag}>`);
    }
  }
}
