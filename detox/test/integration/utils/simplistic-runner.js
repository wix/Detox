const detox = require('detox/internals');

async function main() {
  try {
    await detox.init();
    await test1().catch(e => console.error(e));
    await test2().catch(e => console.error(e));
  } finally {
    await detox.cleanup();
  }
}

async function test1() {
  await device.launchApp();
}

async function test2() {
  await device.terminateApp();
}

main().catch((e) => console.error(e));
