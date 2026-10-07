const fs = require('fs');
const files = ['./src/pages/SignIn.tsx', './src/pages/SignUp.tsx'];
files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/var\(--bg_auth_glow\)/g, 'var(--bg\\_auth\\_glow)');
    content = content.replace(/var\(--bg_map\)/g, 'var(--bg\\_map)');
    content = content.replace(/var\(--bg_brand_solid\)/g, 'var(--bg\\_brand\\_solid)');
    fs.writeFileSync(file, content, 'utf8');
  }
});
