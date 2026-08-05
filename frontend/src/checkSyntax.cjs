const fs = require('fs');
const parser = require('@babel/parser');

const content = fs.readFileSync('c:/Users/irmak/Desktop/HOMEY/frontend/src/App.tsx', 'utf8');

try {
  parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript']
  });
  console.log("No syntax errors found by Babel!");
} catch (err) {
  console.error(err.message);
  console.error("Location:", err.loc);
}
