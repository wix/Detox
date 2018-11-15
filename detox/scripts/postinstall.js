if (process.platform === "darwin") {
	require("child_process").execFileSync(`${__dirname}/build_framework.ios.sh`, {
		stdio: "inherit"
	});
	require("child_process").execFileSync(`sudo ${__dirname}/build_wrapper.android.sh`, {
		stdio: "inherit"
	});
}
