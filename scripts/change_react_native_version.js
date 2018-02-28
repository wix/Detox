let fs = require('fs');
const filePath = __dirname + '/../detox/test/package.json';
let packageJson = require(filePath);

packageJson.dependencies['react-native'] = process.argv[2];

fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));