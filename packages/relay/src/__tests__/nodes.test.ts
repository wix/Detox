/**
 * The nodes-file contract (spec 008 CLI): zero nodes, unreadable, or a
 * malformed entry = startup failure — and no refusal ever echoes a token.
 */
import { describe, it, expect } from 'vitest';

import { findSelfDialNode, parseNodesConfig } from '../nodes';

const SECRET = 'super-secret-node-token';

describe('parseNodesConfig', () => {
  it('parses a valid roster and keeps config order', () => {
    const nodes = parseNodesConfig(
      JSON.stringify([
        { name: 'mac-a', url: 'ws://127.0.0.1:1', token: 't1' },
        { name: 'mac-b', url: 'wss://farm.local:2', token: 't2' },
      ]),
    );
    expect(nodes.map((n) => n.name)).toEqual(['mac-a', 'mac-b']);
    expect(nodes[1].url).toBe('wss://farm.local:2');
  });

  /**
   * @issue DTX-7040
   * Absent and empty are different signals: a missing `token` is the
   * deliberate choice of an auth-off node, while an empty string
   * reads as a stray blank in the config file — neither "no auth" nor a
   * real credential — so it is refused rather than silently accepted.
   */
  it('accepts a tokenless entry — that node runs with auth off', () => {
    const nodes = parseNodesConfig(
      JSON.stringify([
        { name: 'mini-2', url: 'ws://mini-2.local:8080' },
        { name: 'mini-3', url: 'ws://mini-3.local:8080', token: 'guarded' },
      ]),
    );
    expect(nodes[0].token).toBeUndefined();
    expect('token' in nodes[0]).toBe(false);
    expect(nodes[1].token).toBe('guarded');
  });

  it.each([
    ['not JSON', 'nonsense{'],
    ['not an array', JSON.stringify({ name: 'mac-a' })],
    ['zero nodes', '[]'],
    ['a non-object entry', JSON.stringify(['mac-a'])],
    ['a missing name', JSON.stringify([{ url: 'ws://x:1', token: 't' }])],
    ['an empty name', JSON.stringify([{ name: '', url: 'ws://x:1', token: 't' }])],
    ['a non-ws url', JSON.stringify([{ name: 'a', url: 'http://x:1', token: 't' }])],
    // See DTX-7040: a missing token is legal (auth-off node); an empty string is refused, not a choice.
    ['an empty token', JSON.stringify([{ name: 'a', url: 'ws://x:1', token: '' }])],
    ['a non-string token', JSON.stringify([{ name: 'a', url: 'ws://x:1', token: 42 }])],
    [
      'a duplicate name',
      JSON.stringify([
        { name: 'a', url: 'ws://x:1', token: 't' },
        { name: 'a', url: 'ws://y:2', token: 't' },
      ]),
    ],
  ])('refuses %s at startup', (_label, text) => {
    expect(() => parseNodesConfig(text)).toThrow(/invalid --nodes config/);
  });

  /**
   * @issue DTX-7039
   * A userinfo-bearing URL would smuggle a secret into every place the URL
   * is later formatted — logs, dial errors — so the check runs at parse
   * time, before the URL exists anywhere else. `token` is the one field
   * meant to carry a secret.
   */
  it('refuses a URL with embedded credentials — the token field is the only secret carrier', () => {
    let message = '';
    try {
      parseNodesConfig(
        JSON.stringify([{ name: 'a', url: `ws://user:${SECRET}@host:1`, token: 't' }]),
      );
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).toMatch(/credentials/);
    expect(message).not.toContain(SECRET);
  });

  it('never echoes a token value into a refusal message', () => {
    let message = '';
    try {
      parseNodesConfig(JSON.stringify([{ name: 'a', url: 'nope', token: SECRET }]));
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    expect(message).not.toBe('');
    expect(message).not.toContain(SECRET);
  });
});

describe('findSelfDialNode', () => {
  const SELF = new Set(['127.0.0.1', '::1', 'localhost']);

  it('finds a roster entry naming the relay itself — same host spelling, same bound port', () => {
    const nodes = [
      { name: 'mini-2', url: 'ws://192.168.1.20:8080' },
      { name: 'oops', url: 'ws://127.0.0.1:8090' },
    ];
    expect(findSelfDialNode(nodes, 8090, SELF)?.name).toBe('oops');
  });

  it('a self host on a DIFFERENT port is a legal co-located server, not a self-dial', () => {
    const nodes = [{ name: 'local-node', url: 'ws://127.0.0.1:8080' }];
    expect(findSelfDialNode(nodes, 8090, SELF)).toBeUndefined();
  });

  it('matches hostnames case-insensitively and the ws default port 80', () => {
    expect(
      findSelfDialNode([{ name: 'a', url: 'ws://LOCALHOST' }], 80, SELF)?.name,
    ).toBe('a');
    expect(
      findSelfDialNode([{ name: 'b', url: 'wss://localhost' }], 443, SELF)?.name,
    ).toBe('b');
  });

  it('a foreign host never matches, whatever the port', () => {
    expect(
      findSelfDialNode([{ name: 'mini-3', url: 'ws://mini-3.local:8090' }], 8090, SELF),
    ).toBeUndefined();
  });

  it('an unparseable URL is not this guard’s concern (parseNodesConfig refused it already)', () => {
    expect(findSelfDialNode([{ name: 'x', url: 'not-a-url' }], 80, SELF)).toBeUndefined();
  });
});
