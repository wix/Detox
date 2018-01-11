// Gets a fully qualified class path of espresso and downloads it in a temp dir
const os = require("os");
const downloadFileSync = require("download-file-sync");
const fs = require("fs");

module.exports = function downloadEspresso(fullyQualifiedClass) {
	const tmpDir = os.tmpdir();
	const path = fullyQualifiedClass.replace(/\./g, "/");
	const fileContent = downloadFileSync(
		`http://android.googlesource.com/platform/frameworks/testing/+/android-support-test/espresso/core/src/main/java/${path}.java?format=TEXT`
	);

	const result = Buffer.from(fileContent, "base64").toString("ascii");
	const filePath = tmpDir + "/download.java";
	fs.writeFileSync(filePath, result);
	return filePath;
};
