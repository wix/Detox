// Repository policy is separate from the release state machine. Other repositories
// must supply their own package/version/build policy before reusing the runner.
const nativeAndroid = (version) => {
  const prefix = `Detox-android/com/wix/detox/${version}/detox-${version}`;
  return [`${prefix}.aar`, `${prefix}.pom`, `${prefix}-sources.jar`];
};

module.exports = {
  repository: 'wix/Detox',
  branch: 'master',
  workflow: '.github/workflows/release.yml',
  // Published in this order. All packages share one version; the root package.json
  // only mirrors it and is never published.
  packages: [
    {
      name: 'detox',
      directory: 'detox',
      requiredFiles: (version) => [
        'package.json',
        'README.md',
        'LICENSE',
        'index.js',
        'index.d.ts',
        'local-cli/cli.js',
        'scripts/postinstall.js',
        'android/build.gradle',
        'Detox-ios-src.tbz',
        'Detox-ios-framework.tbz',
        'Detox-ios-xcuitest.tbz',
        ...nativeAndroid(version),
      ],
    },
    {
      name: 'detox-cli',
      directory: 'detox-cli',
      requiredFiles: () => ['package.json', 'cli.js'],
    },
  ],
  versionFiles: ['package.json', 'detox/package.json', 'detox-cli/package.json'],
  // Only one docs snapshot per major (e.g. 20.x), refreshed by every stable release.
  documentationVersion: (version, npmTag) =>
    npmTag === 'latest' ? `${version.split('.')[0]}.x` : '',
  prereleaseTags: ['next', 'rc', 'alpha'],
  // The GitHub status only locates the build; its public Buildkite record is the evidence,
  // so the account that happens to post statuses does not matter.
  nativeStatus: 'buildkite/detox',
  nativePipeline: 'https://buildkite.com/wix-mobile-oss/detox',
  label: 'release',
};
