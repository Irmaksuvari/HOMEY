const fs = require('fs');
const lines = fs.readFileSync('src/App.tsx', 'utf8').split('\n');
lines.forEach((l, i) => {
  if(l.includes('Evrak')) console.log((i+1) + ': ' + l.trim());
});
