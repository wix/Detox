const detoxInternals = require('detox/internals');

async function main() {
  try {
    await detoxInternals.globalSetup();

    try {
      await detoxInternals.setup({ workerId: 1 });
      try { await test1() } catch (e) { console.error(e); }
      try { await test2() } catch (e) { console.error(e); }
    } finally {
      await detoxInternals.teardown();
    }
  } finally {
    await detoxInternals.globalTeardown();
  }
}

async function test1() {
  await device.launchApp();
}

async function test2() {
  await device.terminateApp();
}

main().catch((e) => console.error(e));
