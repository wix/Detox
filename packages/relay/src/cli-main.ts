/**
 * The relay CLI's whole logic, callable — `detox relay` (spec 009)
 * delegates here, and the legacy `dist/relay/cli.js` entry is a shell
 * over it. One main, two doors, flag-for-flag identical by construction.
 * Logic below the flag layer lives in `resolveRelayCli` + `parseNodesConfig`
 * + `createDetoxRelay`, where units gate it.
 */
import { readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

import { createDetoxRelay, DEFAULT_HOST } from './relay';
import { dialableUrl, resolveRelayCli, RelayCliError } from './cli-config';
import { findSelfDialNode, parseNodesConfig, type RelayNodeConfig } from './nodes';
import { relayError, relayLog } from './log';

const HELP = `
detox relay — one address for a fleet of Detox Servers

Usage:
  detox relay --nodes <file> [options]

Options:
  --nodes <file>      REQUIRED (or env DETOX_RELAY_NODES): JSON array of
                      { "name", "url", "token"? } — one entry per node.
                      "token" is the NODE's bearer token, needed only when
                      that node runs with auth on (auth is hop-pairwise:
                      clients present the RELAY's token, the relay presents
                      each node's; nothing is forwarded through). Omit it
                      for a node with auth off. A file, never argv: any
                      tokens in it are secrets — guard the file accordingly.
  --port <number>     Port to listen on (default: 0 = pick a free one, or env PORT)
  --host <address>    Interface to bind (default: ${DEFAULT_HOST}, or env
                      DETOX_RELAY_HOST). Use 0.0.0.0 to accept the LAN.
  --blob-budget <bytes>
                      Byte budget of the relay's own build cache (uploads are
                      staged here, then pushed node-ward on install). Default: 8 GiB.
  --keepalive-window <seconds>
                      How long a client may stay unresponsive before its
                      session ends and every node it touched reclaims
                      (default: 120, max: 604800 = 7 days, or env
                      DETOX_RELAY_KEEPALIVE_WINDOW). 0 turns liveness polls
                      OFF entirely — your own risk.
  --help, -h          Show this help

Authentication (opt-in, OFF by default):
  With no token configured the relay's own door is open. Configure a token
  and clients must send "Authorization: Bearer <token>".

  DETOX_RELAY_TOKEN   Preferred way to supply a token.
  --token <string>    Same, but a command line is visible to every process on
                      the machine (\`ps\`), so prefer the environment variable.

A relay owns no devices, so it has no pool options of any kind — it serves
what its nodes can (spec 009).
`;

export interface RelayCliInput {
  argv: readonly string[];
  env: Readonly<Record<string, string | undefined>>;
  /**
   * An in-process roster (the `detox relay` verb's config-sourced
   * `server.nodes`, spec 009). An explicit `--nodes`/DETOX_RELAY_NODES file
   * still wins; with neither, this list serves — and node tokens never
   * touch a temp file (a roster on disk is a credential lying there).
   */
  nodes?: readonly RelayNodeConfig[];
}

const LOOPBACK_HOSTS = new Set(['127.0.0.1', '::1', 'localhost']);

export async function runRelayCli({ argv, env, nodes: inlineNodes }: RelayCliInput): Promise<void> {
  if (argv.includes('--help') || argv.includes('-h')) {
    console.log(HELP);
    process.exit(0);
  }

  const config = resolveRelayCli({ argv, env, hasInlineNodes: inlineNodes !== undefined });

  let nodes: readonly RelayNodeConfig[];
  if (config.nodesFile !== undefined) {
    let nodesText: string;
    try {
      nodesText = readFileSync(config.nodesFile, 'utf8');
    } catch (err) {
      throw new RelayCliError(
        `Could not read the nodes file at ${config.nodesFile}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    nodes = parseNodesConfig(nodesText);
  } else if (inlineNodes !== undefined) {
    // The verb's config already went through zod's strict node schema, but
    // the roster-level rules (zero nodes, duplicate names) live here — one
    // validator, both doors.
    nodes = parseNodesConfig(JSON.stringify(inlineNodes));
  } else {
    // resolveRelayCli refused already; this is unreachable by construction.
    throw new RelayCliError('a relay needs its fleet — no roster from any source');
  }

  if (config.auth === undefined && !LOOPBACK_HOSTS.has(config.host)) {
    relayLog(
      `WARNING: auth is OFF and the bind (${config.host}) is not loopback — anyone on ` +
        'the network can drive this fleet. Set DETOX_RELAY_TOKEN to guard the door.',
    );
  }

  const relay = await createDetoxRelay({
    port: config.port,
    host: config.host,
    auth: config.auth,
    keepalive: config.keepalive,
    nodes,
    blobs: { root: config.blobRoot, budgetBytes: config.blobBudget },
  });

  // The self-dial guard, checked against the bound port (`--port 0` is only
  // knowable here) — refusing after bind but before the readiness announce,
  // so nothing ever dialed a relay that is about to refuse itself.
  const selfHosts = new Set<string>(LOOPBACK_HOSTS);
  const wildcard = config.host === '0.0.0.0' || config.host === '::';
  if (!wildcard) selfHosts.add(config.host.toLowerCase());
  if (wildcard) {
    for (const iface of Object.values(networkInterfaces()).flatMap((list) => list ?? [])) {
      selfHosts.add(iface.address.toLowerCase());
    }
  }
  const selfDial = findSelfDialNode(nodes, relay.port, selfHosts);
  if (selfDial !== undefined) {
    await relay.close();
    throw new RelayCliError(
      `node "${selfDial.name}" (${selfDial.url}) is this relay's own address — a roster ` +
        'naming the relay itself recurses (a session per hop) until the machine runs out ' +
        'of sockets. Point the entry at a Detox SERVER; on one Mac that is a separate ' +
        '`detox server` process on its own port.',
    );
  }

  const url = dialableUrl(config.host, relay.port);
  relayLog(
    `Relay listening on ${url} (${String(nodes.length)} node(s): ${nodes.map((n) => n.name).join(', ')}, auth ${config.auth ? 'on' : 'off'})`,
  );
  // Machine-readable readiness for whoever spawned us (`--port 0` makes the
  // log line unscrapeable) — same IPC shape as the server's.
  process.send?.({ type: 'listening', url, token: config.auth?.token });

  const shutdown = async (): Promise<void> => {
    relayLog('Shutting down...');
    await relay.close();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown());
  process.on('SIGTERM', () => void shutdown());
}

/** The shared error path: a typed refusal prints its message, nothing else prints a stack. */
export function reportRelayCliError(err: unknown): void {
  relayError(err instanceof Error ? err.message : String(err));
}
