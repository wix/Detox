import { describe, it, expect } from 'vitest';

import { redactArgv, redactUrl, redactUrlForLog, redactValue } from '../redact';

describe('redact (spec 013 — one rule for every writer)', () => {
  it('keeps origin + path of an http(s) URL, only the origin of a ws(s) URL (the path is a claim nonce), and leaves the rest', () => {
    expect(redactUrl(new URL('https://user:pw@host:8443/a/b.zip?sig=1#x'))).toBe('https://host:8443/a/b.zip');
    expect(redactUrlForLog('https://user:pw@host/app.zip?token=t')).toBe('https://host/app.zip');
    expect(redactUrlForLog('not a url')).toBe('<malformed-url>');
    expect(redactValue('ws://127.0.0.1:5555/nonce-abc')).toBe('ws://127.0.0.1:5555/…');
    expect(redactValue('wss://farm.example/')).toBe('wss://farm.example');
    expect(redactValue('ws://[::1')).toBe('<malformed-url>');
    expect(redactValue({ a: ['http://u:p@h/x?q=1', 7, null], b: { c: 'plain' } })).toEqual({ a: ['http://h/x', 7, null], b: { c: 'plain' } });
    expect(redactArgv(['/usr/bin/xcrun', 'simctl', 'launch', 'U', 'com.x', '-detoxServer', 'ws://127.0.0.1:1/secret', '-detoxSessionId', 'com.x'])).toEqual([
      '/usr/bin/xcrun', 'simctl', 'launch', 'U', 'com.x', '-detoxServer', 'ws://127.0.0.1:1/…', '-detoxSessionId', 'com.x',
    ]);
  });
});
