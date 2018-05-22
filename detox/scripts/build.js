const childProcess = require('child_process');
const fs = require('fs-extra');

// Just make the usage a little prettier
function sh(cmdline, opts) {
  const args = cmdline.split(' ');
  const cmd = args.shift();
  return childProcess.execFileSync(cmd, args, opts);
}

if (process.platform === 'darwin') {
  console.log("\nPackaging Detox iOS sources");

  fs.removeSync('Detox-ios-src.tbz');
  // Prepare Earl Grey without building
  sh("ios/EarlGrey/Scripts/setup-earlgrey.sh");
  sh("find ./ios -name Build -type d -exec rm -rf {} ;");

  sh("tar -cjf ../Detox-ios-src.tbz .", { cwd: "ios" });
}

if (process.argv[2] === "android" || process.argv[3] === "android") {
	console.log("\nBuilding Detox aars");
	const aars = [
		"detox-minReactNative44-debug.aar",
		"detox-minReactNative46-debug.aar",
		"detox-minReactNative44-release.aar",
		"detox-minReactNative46-release.aar"
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
