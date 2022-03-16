const fs = require('fs');
const path = require('path');
const https = require('https');

async function run() {
  const projectPath = process.argv[2];
  const reactNativeVersion = process.argv[3];
  const depsSection = process.argv[4] || 'dependencies';

  const filePath = path.join(process.cwd(), projectPath, 'package.json');
  console.log(`Trying to change react-native dependency in  ${filePath}`);

  let packageJson = require(filePath);

  if (depsSection === 'devDependencies') {
    console.log(`Changed dependency:
      react-native: ${reactNativeVersion}`);
    packageJson.devDependencies['react-native'] = reactNativeVersion;
  } else {
    const data = await fetch(`https://registry.npmjs.org/react-native/${reactNativeVersion}`);
    const reactVersion = data.peerDependencies.react;

    console.log(`Changed dependencies: 
      react-native: ${reactNativeVersion}
      react: ${reactVersion}`);

    packageJson.dependencies['react'] = reactVersion;
    packageJson.dependencies['react-native'] = reactNativeVersion;
  }

  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
}

async function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, res => {
      res.setEncoding('utf8');
      let body = "";
      res.on('data', data => {
        body += data;
      });
      res.on('end', () => {
        body = JSON.parse(body);
        resolve(body);
      });
      res.on('error', (error) => {
        reject(error);
      });
    });
  });
}

run();
