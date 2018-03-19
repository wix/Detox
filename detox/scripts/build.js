#!/usr/bin/env node

// Javascript for windows support.

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

	childProcess.execFileSync(
		"android/gradlew",
		["assembleDebug", "assembleRelease"],
		{
			cwd: "android",
			stdio: "inherit",
			shell: true
		}
	);

	aars.forEach(aar => {
		fs.copySync(`android/detox/build/outputs/aar/${aar}`, aar);
	});
}
