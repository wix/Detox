const Detox = require("./Detox");

let detox;

async function init(config, params) {
	detox = new Detox(config);
	await detox.init(params);
}

async function cleanup() {
	if (detox) {
		await detox.cleanup();
	}
}

async function beforeEach(...args) {
	if (detox) {
		await detox.beforeEach(...args);
	}
}

async function afterEach(...args) {
	if (detox) {
		await detox.afterEach(...args);
	}
}

//process.on('uncaughtException', (err) => {
//  //client.close();
//
//  throw err;
//});
//
//process.on('unhandledRejection', (reason, p) => {
//  throw reason;
//});

module.exports = {
	init,
	cleanup,
	beforeEach,
	afterEach
};
