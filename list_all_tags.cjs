const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx'));

let allTags = new Set();
for (const file of files) {
  const content = fs.readFileSync(path.join(srcDir, file), 'utf8');
  const tags = [...content.matchAll(/<([A-Z][a-zA-Z0-9]+)/g)].map(m => m[1]);
  tags.forEach(t => allTags.add(t));
}
console.log(Array.from(allTags).sort().join('\n'));
