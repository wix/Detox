const fs = require("fs-extra");
const path = require("path");

async function getDirectories(rootPath) {
	const files = await fs.readdir(rootPath);
	const dirs = [];
	for (const file of files) {
		const pathString = path.resolve(rootPath, file);
		if ((await fs.lstat(pathString)).isDirectory()) {
			dirs.push(file);
		}
	}
	return dirs.sort();
}

module.exports = {
	getDirectories
};
