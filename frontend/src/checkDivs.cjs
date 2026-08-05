const fs = require('fs');
const content = fs.readFileSync('c:/Users/irmak/Desktop/HOMEY/frontend/src/App.tsx', 'utf8');

function checkTab(tabName) {
  let startStr = "activeTab === '" + tabName + "'";
  let start = content.indexOf(startStr);
  if(start === -1) {
    console.log(tabName, 'not found');
    return;
  }
  
  start = content.indexOf(startStr, start + 50);
  
  let nextTab = content.indexOf("activeTab ===", start + 50);
  
  let section = content.substring(start, nextTab);
  let opens = (section.match(/<div(?=[\s>])/g) || []).length;
  let closes = (section.match(/<\/div\s*>/g) || []).length;
  console.log(tabName, 'Opens:', opens, 'Closes:', closes, 'Diff:', opens - closes);
}

['appointments', 'processManagement', 'clients', 'analytics', 'team', 'subscription', 'settings'].forEach(checkTab);
