const fs = require('fs');
const path = 'c:/Users/irmak/Desktop/HOMEY/frontend/src/App.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  {
    from: /user\?\.rol === 'YETKILI' \|\| compareIds\(selectedPortfolio\.gorevliUzmanId, user\?\.id\)/g,
    to: 'compareIds(selectedPortfolio.gorevliUzmanId, user?.id)'
  },
  {
    from: /user\?\.rol === 'YETKILI' \|\| compareIds\(selectedPortfolio\?\.gorevliUzmanId, user\?\.id\)/g,
    to: 'compareIds(selectedPortfolio?.gorevliUzmanId, user?.id)'
  },
  {
    from: /compareIds\(selectedPortfolio\?\.gorevliUzmanId, user\?\.id\) \|\| user\?\.rol === 'YETKILI'/g,
    to: 'compareIds(selectedPortfolio?.gorevliUzmanId, user?.id)'
  },
  {
    from: /compareIds\(app\.portfoySahibiId, user\?\.id\) \|\| user\?\.rol === 'YETKILI'/g,
    to: 'compareIds(app.portfoySahibiId, user?.id)'
  },
  {
    from: /if \(!isOwnPortfolio\(portfolio\) && user\?\.rol !== 'YETKILI'\) return;/g,
    to: 'if (!isOwnPortfolio(portfolio)) return;'
  }
];

let replaced = content;
replacements.forEach(r => {
  replaced = replaced.replace(r.from, r.to);
});

fs.writeFileSync(path, replaced, 'utf8');
console.log('App.tsx updated.');
