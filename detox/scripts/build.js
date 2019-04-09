const fs = require('fs-extra');
const {sh} = require('./utils');

if (process.platform === 'darwin') {
	const {packageIosSources} = require('./pack_ios');
  packageIosSources();
}

if (process.argv[2] === "android" || process.argv[3] === "android") {
	console.log("\nBuilding Detox aars");
	const aars = [
		"detox-debug.aar",
		"detox-release.aar"
	];
	aars.forEach(aar => {
		fs.removeSync(aar);
	});

	sh("./gradlew assembleDebug assembleRelease", {
		cwd: "android",
		stdio: "inherit",
		shell: true
	});

	aars.forEach(aar => {
		fs.copySync(`android/detox/build/outputs/aar/${aar}`, aar);
	});
}
