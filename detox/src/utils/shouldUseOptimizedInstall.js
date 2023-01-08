function shouldUseOptimizedInstall(platform, useLegacyLaunchApp) {
    const isOptimizedAppInstallEnabled = !useLegacyLaunchApp;
    const isOptimizedAppInstallSupported = platform === 'android';
    return isOptimizedAppInstallEnabled && isOptimizedAppInstallSupported;
}

module.exports = shouldUseOptimizedInstall;
