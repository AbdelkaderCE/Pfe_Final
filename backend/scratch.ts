console.log('CWD:', process.cwd());
console.log('__dirname:', __dirname);
const path = require('path');
const fs = require('fs');
const fontsDir = path.join(process.cwd(), "assets", "fonts");
console.log('Fonts Dir:', fontsDir);
console.log('Exists:', fs.existsSync(fontsDir));
if (fs.existsSync(fontsDir)) {
  console.log('Files:', fs.readdirSync(fontsDir));
}
