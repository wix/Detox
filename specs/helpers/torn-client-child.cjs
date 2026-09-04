'use strict';
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
/**
 * The child half of `torn-client.ts` (spec 012, test 5): dials the server
 * through the built client bundle, reports its `runId` over IPC, then
 * allocates the given cold probe and waits on the boot — which it never
 * survives: the parent SIGKILLs it once the boot child's `begin` shows in
 * the log. Nothing here disconnects; a torn socket is the whole point.
 */
const path = require('node:path');

async function main() {
  const url = process.env.TORN_SERVER_URL;
  const token = process.env.TORN_SERVER_TOKEN;
  const udid = process.env.TORN_UDID;
  if (!url || !udid) {
    console.error('torn-client-child: TORN_SERVER_URL and TORN_UDID are required');
    process.exit(97);
  }
  const { connect } = require(path.resolve(__dirname, '../../detox/dist/client.js'));
  const detox = await connect({
    server: { url, ...(token ? { headers: { Authorization: `Bearer ${token}` } } : {}) },
  });
  process.send({ type: 'connected', runId: detox.runId });
  await detox.allocateDevice({ type: 'ios.simulator', device: { deviceId: udid } });
  // Reached only if the parent never killed us: keep the socket open so the
  // test's assertions fail on their own terms, not on a clean disconnect.
  setInterval(() => {}, 1 << 30);
}

main().catch((err) => {
  console.error(err);
  process.exit(96);
});
