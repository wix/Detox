if (process.platform === "darwin") {
	require("child_process").execFileSync(`${__dirname}/build_framework.ios.sh`, {
		stdio: "inherit"
	});
	require("child_process").execFileSync(`${__dirname}/build_launcher.android.sh`, {
		stdio: "inherit"
	});
}
