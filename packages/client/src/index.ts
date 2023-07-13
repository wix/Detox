import {createSession, cleanupSessions} from './remote';

async function main() {
  const { device } = await createSession({
    server: {},
    capabilities: {
      browserName: 'safari',
      platformName: 'mac',
    } as any,
  });

  await device.openURL({ url: 'https://www.google.com' });
  await device.relaunchApp();
  await cleanupSessions();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


