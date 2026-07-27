const fs = require('fs');
let code = fs.readFileSync('frontend/src/App.tsx', 'utf8');

const settingsStart = code.indexOf("{activeTab === 'settings'");
const settingsEnd = code.indexOf('</main>', settingsStart);
if (settingsStart > -1 && settingsEnd > -1) {
  let settingsCode = code.substring(settingsStart, settingsEnd);
  settingsCode = settingsCode.replace(/className="flex items-center gap-2"/g, 'className="flex flex-wrap items-center gap-2"');
  settingsCode = settingsCode.replace(/className="flex items-center gap-4"/g, 'className="flex flex-wrap items-center gap-4"');
  code = code.substring(0, settingsStart) + settingsCode + code.substring(settingsEnd);
  fs.writeFileSync('frontend/src/App.tsx', code, 'utf8');
  console.log("Success");
} else {
  console.log("Could not find boundaries");
}
