/**
 * The parity run's dedicated Detox Server (editable helper): `scripts/parity.js`
 * spawns this once for the whole run, reads one JSON line with the address,
 * exports it to the corpus's `.detoxrc.js` via
 * PARITY_SERVER_URL/PARITY_SERVER_TOKEN, and SIGTERMs it when the run is
 * over. The server carries the injectable Detox framework so `launchApp`
 * instruments the real example app.
 */
import { startServer } from './server';
import { resolveDetoxFrameworkExternally } from './real-app';
import { tokenOf } from './project';

async function main(): Promise<void> {
  const frameworkPath = await resolveDetoxFrameworkExternally();
  const server = await startServer({ dedicated: true, iosDetoxFrameworkPath: frameworkPath });

  const stop = (): void => {
    void server.stop().then(
      () => process.exit(0),
      () => process.exit(1),
    );
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);

  // Exactly one line on stdout — the parent's whole protocol.
  console.log(
    JSON.stringify({ type: 'parity-server', url: server.url, token: tokenOf(server.address) }),
  );

  // Holds the event loop open until a signal ends the process; never cleared.
  setInterval(() => undefined, 1 << 30);
}

main().catch((err: unknown) => {
  console.error('[parity-server]', err);
  process.exit(1);
});
