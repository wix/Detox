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

  updateReactNative73DevDependencies(reactNativeVersion, packageJson);

  fs.writeFileSync(filePath, JSON.stringify(packageJson, null, 2));
}

function updateReactNative73DevDependencies(reactNativeVersion, packageJson) {
  const minorVersion = reactNativeVersion.split('.')[1];
  if (minorVersion !== '73') {
    return;
  }

  packageJson.devDependencies['@react-native/babel-preset'] = '0.73.21';
  packageJson.devDependencies['@react-native/eslint-config'] = '0.73.2';
  packageJson.devDependencies['@react-native/metro-config'] = '0.73.5';
  packageJson.devDependencies['@react-native/typescript-config'] = '0.73.1';

  delete packageJson.devDependencies['@react-native-community/cli'];
  delete packageJson.devDependencies['@react-native-community/cli-platform-android'];
  delete packageJson.devDependencies['@react-native-community/cli-platform-ios'];
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
