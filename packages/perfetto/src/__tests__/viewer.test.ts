/**
 * Spec 012a's viewer page, the part a unit test can see: the id is
 * HTML-escaped and JSON-escaped, the title is a non-empty string, and the
 * page names the origin, the sibling path and `mode=embedded`. The inline
 * script itself runs only in a browser, and is exercised by hand.
 */
import { createHash } from 'node:crypto';

import { describe, it, expect } from 'vitest';

import { renderPerfettoViewer, PERFETTO_UI_ORIGIN } from '../viewer';

describe('renderPerfettoViewer', () => {
  it('names the hosted UI in embedded mode, the sibling trace path, and a non-empty title', () => {
    const { html } = renderPerfettoViewer('run-1');
    expect(html).toContain(`${PERFETTO_UI_ORIGIN}/#!/?mode=embedded`);
    expect(html).toContain('/v1/runs/run-1/trace');
    expect(html).toMatch(/<title>detox run run-1<\/title>/);
    expect(html).toContain('"detox run run-1"');
    expect(html).toContain('allow="clipboard-write"');
    expect(html).toContain("'PING'");
    expect(html).toContain("'PONG'");
    // U+2028 is legal in HTML text; only the script element must not see it raw.
    expect(/<script>([\s\S]*?)<\/script>/.exec(html)?.[1]).not.toContain('\u2028');
  });

  it('HTML-escapes and JSON-escapes the id it embeds', () => {
    // The route only ever passes a well-formed id; the page still escapes,
    // so a future widening of the id alphabet cannot become an injection.
    const hostile = `x"<script>alert(1)</script>' \u2028y`;
    const { html } = renderPerfettoViewer(hostile);
    expect(html).not.toContain('<script>alert');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('\\u003cscript>alert(1)\\u003c/script>');
    expect(html).toContain('\\u2028');
    // U+2028 is legal in HTML text; only the script element must not see it raw.
    expect(/<script>([\s\S]*?)<\/script>/.exec(html)?.[1]).not.toContain('\u2028');
    expect(html).toContain(encodeURIComponent(hostile));
  });

  it('pins the page with a CSP whose script and style hashes match the inline blocks', () => {
    const { html, csp } = renderPerfettoViewer('run-1');
    const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
    const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
    const hash = (text: string): string => `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
    expect(csp).toContain(`script-src ${hash(script)}`);
    expect(csp).toContain(`style-src ${hash(style)}`);
    expect(csp).toContain("connect-src 'self'");
    expect(csp).toContain(`frame-src ${PERFETTO_UI_ORIGIN}`);
    expect(csp).toContain("default-src 'none'");
  });
});
