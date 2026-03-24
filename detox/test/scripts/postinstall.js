const fs = require('fs-extra');
const cp = require('child_process');
const { patchGradleByRNVersion } = require('../../scripts/updateGradle');

const patchBoostPodspec = () => {
  const log = message => console.log(`[POST-INSTALL] ${message}`);
  const boostPodspecPath = `${process.cwd()}/node_modules/react-native/third-party-podspecs/boost.podspec`;
  const originalUrl = 'https://boostorg.jfrog.io/artifactory/main/release/1.76.0/source/boost_1_76_0.tar.bz2';
  const patchedUrl = 'https://archives.boost.io/release/1.76.0/source/boost_1_76_0.tar.bz2';

  if (!fs.existsSync(boostPodspecPath)) {
    log('boost.podspec does not exist, skipping patch...');
    return;
  }

  let boostPodspec = fs.readFileSync(boostPodspecPath, 'utf8');

  if (!boostPodspec.includes(originalUrl)) {
    log('boost.podspec is already patched or the URL is different, skipping patch...');
    return;
  }

  log('Applying boost.podspec patch...');
  boostPodspec = boostPodspec.replace(originalUrl, patchedUrl);
  fs.writeFileSync(boostPodspecPath, boostPodspec, 'utf8');
};

function podInstallIfRequired() {
  if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POD_INSTALL) {
    console.log('[POST-INSTALL] Running pod install...');
    patchBoostPodspec();

    cp.execSync('pod install', {
      cwd: `${process.cwd()}/ios`,
      stdio: 'inherit'
    });
  }
}

function patchReactNativeWebViewForRN84() {
  const log = message => console.log(`[POST-INSTALL] ${message}`);
  const reactNativePackageJsonPath = `${process.cwd()}/node_modules/react-native/package.json`;
  const webViewSpecPath = `${process.cwd()}/node_modules/react-native-webview/src/RNCWebViewNativeComponent.ts`;

  if (!fs.existsSync(reactNativePackageJsonPath) || !fs.existsSync(webViewSpecPath)) {
    log('react-native or react-native-webview is missing, skipping WebView patch...');
    return;
  }

  const reactNativeVersion = JSON.parse(fs.readFileSync(reactNativePackageJsonPath, 'utf8')).version;
  const [major, minor] = reactNativeVersion.split('.').map(Number);
  if (major !== 0 || minor < 84) {
    log(`react-native@${reactNativeVersion} does not need the WebView RN0.84 patch, skipping...`);
    return;
  }

  let webViewSpec = fs.readFileSync(webViewSpecPath, 'utf8');
  const navigationTypeUnion = /navigationType:\s*\n\s*\|\s*'click'\s*\n\s*\|\s*'formsubmit'\s*\n\s*\|\s*'backforward'\s*\n\s*\|\s*'reload'\s*\n\s*\|\s*'formresubmit'\s*\n\s*\|\s*'other';/g;

  if (!navigationTypeUnion.test(webViewSpec)) {
    log('react-native-webview spec is already patched or has changed, skipping WebView patch...');
    return;
  }

  log('Applying react-native-webview RN0.84 compatibility patch...');
  webViewSpec = webViewSpec.replace(navigationTypeUnion, 'navigationType: string;');
  fs.writeFileSync(webViewSpecPath, webViewSpec, 'utf8');
}

console.log('[POST-INSTALL] Running Detox\'s test-app post-install script...');
podInstallIfRequired();
patchGradleByRNVersion()
patchReactNativeWebViewForRN84();
console.log('[POST-INSTALL] Completed!');
