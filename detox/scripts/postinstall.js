const { setGradleVersionByRNVersion } = require('./updateGradle');
if (process.platform === 'darwin' && !process.env.DETOX_DISABLE_POSTINSTALL) {
	require('child_process').execFileSync(`${__dirname}/build_framework.ios.sh`, {
		stdio: 'inherit'
	});

}
setGradleVersionByRNVersion();
