let fs = require('fs');
let path = require('path');

const projectPath = process.argv[2];
const reactNativeVersion = process.argv[3];

const filePath = path.join(process.cwd(), projectPath, 'package.json');
let packageJson = require(filePath);

console.log(`Changing react-native dependency in ${filePath} to ${reactNativeVersion}`);

packageJson.dependencies['react-native'] = reactNativeVersion;
fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));