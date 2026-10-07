const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  // Match things like bg-[var(--bg_primary)] or text-[var(--text_brand_solid)]
  // We need to replace all underscores INSIDE the var(...) with \_
  // A regex with a replacer function:
  let changed = false;
  const newContent = content.replace(/\[var\(--([^\]]+)\)\]/g, (match, p1) => {
    if (p1.includes('_')) {
      changed = true;
      return `[var(--${p1.replace(/_/g, '\\_')})]`;
    }
    return match;
  });
  
  if (changed) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
