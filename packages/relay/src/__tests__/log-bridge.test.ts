/**
 * `log-bridge.ts` units (spec 008): the retry loop
 * (`followNodeLog`) over a fake dialer — natural end, resume-while-alive,
 * one warn line once the node is gone — plus the real HTTP dialer
 * (`createNodeLogDialer`) against a tiny local server, covering the
 * ws→http origin mapping, the node's token, and a non-200 refusal.
 */
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

import { describe, it, expect, vi, afterEach } from 'vitest';

import { followNodeLog, createNodeLogDialer, type NodeLogDialer } from '../log-bridge';

function fakeLine(seq: number): string {
  return JSON.stringify({ seq, ts: seq, level: 'info', kind: 'log', node: { id: 'conn', type: 'server', name: 'connection' }, msg: `line ${String(seq)}` });
}

describe('followNodeLog', () => {
  it('resolves once the dialer resolves — the node ended its own stream naturally', async () => {
    const seen: number[] = [];
    const dialer: NodeLogDialer = {
      dial: async (_after, _signal, onRawLine) => {
        onRawLine(fakeLine(1));
        onRawLine(fakeLine(2));
      },
    };
    await followNodeLog({
      dialer,
      nodeName: 'mac-a',
      isAlive: () => true,
      onLine: (line) => seen.push(line.seq),
      onNodeGone: () => undefined,
    });
    expect(seen).toEqual([1, 2]);
  });

  it('resumes at after=<last seq> when a drop happens while the node is still presumed alive', async () => {
    let attempt = 0;
    const afters: (number | undefined)[] = [];
    const dialer: NodeLogDialer = {
      dial: async (after, _signal, onRawLine) => {
        afters.push(after);
        attempt += 1;
        if (attempt === 1) {
          onRawLine(fakeLine(1));
          throw new Error('transient drop');
        }
        onRawLine(fakeLine(2));
      },
    };
    const seen: number[] = [];
    await followNodeLog({ dialer, nodeName: 'mac-a', isAlive: () => true, onLine: (l) => seen.push(l.seq), onNodeGone: () => undefined });
    expect(afters).toEqual([undefined, 1]);
    expect(seen).toEqual([1, 2]);
  });

  it('stops with one warn line, naming the node, the moment the node is gone', async () => {
    const dialer: NodeLogDialer = {
      dial: () => Promise.reject(new Error('connection reset')),
    };
    const gone: string[] = [];
    await followNodeLog({ dialer, nodeName: 'mac-a', isAlive: () => false, onLine: () => undefined, onNodeGone: (name) => gone.push(name) });
    expect(gone).toEqual(['mac-a']);
  });

  it('a malformed line from the node is skipped, never crashes the follow', async () => {
    const dialer: NodeLogDialer = {
      dial: async (_after, _signal, onRawLine) => {
        onRawLine('not json');
        onRawLine(JSON.stringify({ seq: 1, level: 'not-a-level', node: {} })); // bad level
        onRawLine(fakeLine(2));
      },
    };
    const seen: number[] = [];
    await followNodeLog({ dialer, nodeName: 'mac-a', isAlive: () => true, onLine: (l) => seen.push(l.seq), onNodeGone: () => undefined });
    expect(seen).toEqual([2]);
  });

  it('an already-aborted signal returns immediately without dialing', async () => {
    const dial = vi.fn();
    const controller = new AbortController();
    controller.abort();
    await followNodeLog({ dialer: { dial }, nodeName: 'mac-a', isAlive: () => true, onLine: () => undefined, onNodeGone: () => undefined, signal: controller.signal });
    expect(dial).not.toHaveBeenCalled();
  });
});

describe('createNodeLogDialer', () => {
  let server: Server | undefined;
  afterEach(async () => {
    if (server) await new Promise<void>((resolve) => server?.close(() => resolve()));
    server = undefined;
  });

  function listen(handler: (req: IncomingMessage, res: ServerResponse) => void): Promise<number> {
    return new Promise((resolve) => {
      server = createServer(handler);
      server.listen(0, '127.0.0.1', () => resolve((server?.address() as AddressInfo).port));
    });
  }

  it('GETs /v1/runs/<id>/log?follow=1 with the node token, over http even for a ws:// node url', async () => {
    let seenPath: string | undefined;
    let seenAuth: string | undefined;
    const port = await listen((req, res) => {
      seenPath = req.url;
      seenAuth = req.headers.authorization;
      res.writeHead(200, { 'content-type': 'application/x-ndjson' });
      res.end(`${fakeLine(1)}\n`);
    });

    const dialer = createNodeLogDialer(`ws://127.0.0.1:${String(port)}`, 'node-token', 'node-run-1');
    const lines: string[] = [];
    await dialer.dial(undefined, undefined, (l) => lines.push(l));

    expect(seenPath).toBe('/v1/runs/node-run-1/log?follow=1');
    expect(seenAuth).toBe('Bearer node-token');
    expect(lines).toEqual([fakeLine(1)]);
  });

  it('includes after= on a resumed attempt, and sends no Authorization header for a tokenless node', async () => {
    let seenPath: string | undefined;
    let seenAuth: string | undefined;
    const port = await listen((req, res) => {
      seenPath = req.url;
      seenAuth = req.headers.authorization;
      res.writeHead(200);
      res.end('');
    });
    const dialer = createNodeLogDialer(`ws://127.0.0.1:${String(port)}`, undefined, 'node-run-1');
    await dialer.dial(7, undefined, () => undefined);
    expect(seenPath).toBe('/v1/runs/node-run-1/log?follow=1&after=7');
    expect(seenAuth).toBeUndefined();
  });

  it('rejects on a non-200 response', async () => {
    const port = await listen((_req, res) => {
      res.writeHead(404);
      res.end();
    });
    const dialer = createNodeLogDialer(`ws://127.0.0.1:${String(port)}`, undefined, 'missing');
    await expect(dialer.dial(undefined, undefined, () => undefined)).rejects.toThrow(/404/);
  });

  it('rejects when the socket errors before any response', async () => {
    // Nothing listens on this port.
    const dialer = createNodeLogDialer('ws://127.0.0.1:1', undefined, 'x');
    await expect(dialer.dial(undefined, undefined, () => undefined)).rejects.toBeInstanceOf(Error);
  });
});
