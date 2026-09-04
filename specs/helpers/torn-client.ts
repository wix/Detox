/**
 * A client that dies mid-boot (spec 012, test 5): a child process reports
 * its `runId` over IPC, allocates and boots a cold probe, and is
 * SIGKILLed by this parent the moment the parent's own `follow` stream shows
 * the boot child's `begin`. The server never hears a goodbye — the socket
 * simply closes with the allocation, and the boot inside it, in flight.
 *
 * The child (`torn-client-child.cjs`) loads the built client bundle, the
 * real artifact a runner loads, exactly like `probe-runner.cjs`.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';

import type { DetoxServerAddress } from 'detox/client';

import { dialConnectionLog } from './session-log';
import { tokenOf } from './project';

export interface TornClientOptions {
  server: DetoxServerAddress;
  udid: string;
  /** The one kill point spec 012 needs; named so a later spec can add another without a boolean. */
  killWhen: 'boot-child-begun';
  signal?: AbortSignal;
}

export interface TornClientResult {
  exitedBy: 'SIGKILL' | `exit ${number}`;
  runId: string;
}

const CHILD = path.resolve(__dirname, 'torn-client-child.cjs');

interface ConnectedMessage {
  type: 'connected';
  runId: string;
}

function isConnectedMessage(message: unknown): message is ConnectedMessage {
  return (
    typeof message === 'object' &&
    message !== null &&
    (message as Partial<ConnectedMessage>).type === 'connected' &&
    typeof (message as Partial<ConnectedMessage>).runId === 'string'
  );
}

export async function runTornClient({ server, udid, killWhen, signal }: TornClientOptions): Promise<TornClientResult> {
  if (killWhen !== 'boot-child-begun') {
    throw new Error(`runTornClient: unknown killWhen "${killWhen as string}"`);
  }
  let token: string | undefined;
  try {
    token = tokenOf(server);
  } catch {
    token = undefined;
  }
  const child = spawn('node', [CHILD], {
    env: { ...process.env, TORN_SERVER_URL: server.url, TORN_SERVER_TOKEN: token ?? '', TORN_UDID: udid },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    signal,
  });
  child.on('error', () => {
    /* surfaced through the exit below */
  });
  const exited = new Promise<TornClientResult['exitedBy']>((resolve) => {
    child.once('exit', (code, sig) => resolve(sig === 'SIGKILL' ? 'SIGKILL' : `exit ${code ?? -1}`));
  });

  const runId = await new Promise<string>((resolve, reject) => {
    child.on('message', (message: unknown) => {
      if (isConnectedMessage(message)) resolve(message.runId);
    });
    void exited.then((by) => reject(new Error(`torn client exited (${by}) before it connected`)));
  });

  const follow = dialConnectionLog(server).follow(runId, { signal });
  await follow.next((line) => line.kind === 'begin' && line.fields?.op === 'boot');
  child.kill('SIGKILL');
  const exitedBy = await exited;
  return { exitedBy, runId };
}
