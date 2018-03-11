const os = require("os");
const downloadFileSync = require("download-file-sync");
const fs = require("fs");
const url = require("url");
const path = require("path");

function downloadFile(fileUrl) {
	const urlPathname = url.parse(fileUrl).pathname;
	const fileName = urlPathname.split("/").pop();
	const filePath = path.join(os.tmpdir(), fileName);

	const fileContent = downloadFileSync(fileUrl);
	const result = Buffer.from(fileContent, "base64").toString("ascii");

	fs.writeFileSync(filePath, result);
	return filePath;
}

module.exports = downloadFile;
