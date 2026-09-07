/**
 * The legacy standalone entry (`dist/relay/cli.js`) — a shell over the one
 * relay main. `detox relay` (spec 009) calls the same
 * `runRelayCli`, so the two doors cannot drift flag-for-flag.
 */
import { runRelayCli, reportRelayCliError } from './cli-main';

runRelayCli({ argv: process.argv.slice(2), env: process.env }).catch((err: unknown) => {
  reportRelayCliError(err);
  process.exit(1);
});
