/**
 * The legacy standalone entry (`dist/server/cli.js`) — a shell over the one
 * server main. `detox server` (spec 009) calls the same
 * `runServerCli`, so the two doors cannot drift flag-for-flag.
 */
import { runServerCli } from './cli-main';

runServerCli({ argv: process.argv.slice(2), env: process.env }).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
