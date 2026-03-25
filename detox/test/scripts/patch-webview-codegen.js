const fs = require('fs');
const path = require('path');

const log = message => console.log(`[PATCH-WEBVIEW] ${message}`);

const testAppRoot = path.resolve(__dirname, '..');
const reactNativePackageJsonPath = path.join(testAppRoot, 'node_modules/react-native/package.json');
const webViewSpecPath = path.join(testAppRoot, 'node_modules/react-native-webview/src/RNCWebViewNativeComponent.ts');

if (!fs.existsSync(reactNativePackageJsonPath) || !fs.existsSync(webViewSpecPath)) {
  log('react-native or react-native-webview is missing, skipping.');
  process.exit(0);
}

const reactNativeVersion = JSON.parse(fs.readFileSync(reactNativePackageJsonPath, 'utf8')).version;
const [major, minor] = reactNativeVersion.split('.').map(Number);
if (major !== 0 || minor < 84) {
  log(`react-native@${reactNativeVersion} does not need the WebView patch, skipping.`);
  process.exit(0);
}

let webViewSpec = fs.readFileSync(webViewSpecPath, 'utf8');
const navigationTypeUnion = /navigationType:\s*\|?\s*'click'\s*\|\s*'formsubmit'\s*\|\s*'backforward'\s*\|\s*'reload'\s*\|\s*'formresubmit'\s*\|\s*'other';/g;

if (!navigationTypeUnion.test(webViewSpec)) {
  log('Spec already patched or changed, skipping.');
  process.exit(0);
}

navigationTypeUnion.lastIndex = 0;
log('Patching react-native-webview navigationType union → string for Android codegen compatibility...');
webViewSpec = webViewSpec.replace(navigationTypeUnion, 'navigationType: string;');
fs.writeFileSync(webViewSpecPath, webViewSpec, 'utf8');
log('Done.');
