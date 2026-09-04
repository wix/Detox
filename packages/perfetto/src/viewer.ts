/**
 * The viewer page (spec 012a): one self-contained document that follows
 * Perfetto's embedding reference (`docs/visualization/embedding-api-reference.md`,
 * `embedding-the-ui.md`) — an iframe on `https://ui.perfetto.dev/#!/?mode=embedded`,
 * `PING` every 250 ms until a `PONG` arrives from the iframe's own window,
 * then one `fetch` of the sibling `trace` path (same origin as the page: no
 * CORS, `Authorization` settable) and one `postMessage({ perfetto: { buffer,
 * title, fileName } })`. The page never sets `localOnly: false`, `shareable`
 * or `downloadable`: with Perfetto's defaults the posted trace stays in
 * browser memory and its Share/Download buttons stay disabled.
 *
 * An optional bearer for the trace fetch rides the URL fragment
 * (`#token=…`): a fragment is never sent to a server; the page reads it once
 * and erases it from the address bar with `history.replaceState`.
 *
 * The inline script runs only in a browser, which the unit harness does not
 * have: it is kept to the minimum the embedding reference requires, and is
 * exercised by hand against `ui.perfetto.dev`. What IS unit-tested: the id is HTML-escaped and JSON-escaped, the title is
 * a non-empty string, and the page names the origin, the sibling path and
 * `mode=embedded`.
 */
import { createHash } from 'node:crypto';

export const PERFETTO_UI_ORIGIN = 'https://ui.perfetto.dev';

export interface PerfettoViewerPage {
  html: string;
  /**
   * A `Content-Security-Policy` that pins the page to what the header comment
   * promises: scripts and styles only from this document (by hash), fetches
   * only to the page's own origin, frames only to Perfetto, nothing else.
   */
  csp: string;
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** JSON, with `</script>` and the U+2028/2029 hazards made inert inside a `<script>` element. */
function scriptSafeJson(value: string): string {
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
}

function sha256(text: string): string {
  return `'sha256-${createHash('sha256').update(text, 'utf8').digest('base64')}'`;
}

const STYLE = `
  html, body { margin: 0; height: 100%; background: #111; color: #ddd; font: 13px/1.4 -apple-system, system-ui, sans-serif; }
  body { display: flex; flex-direction: column; }
  #status { flex: none; padding: 6px 12px; background: #222; border-bottom: 1px solid #333; white-space: pre-wrap; }
  #status.error { color: #f88; }
  iframe { flex: 1; border: 0; width: 100%; }
`;

function script(runId: string): string {
  return `
(function () {
  var RUN_ID = ${scriptSafeJson(runId)};
  var ORIGIN = ${scriptSafeJson(PERFETTO_UI_ORIGIN)};
  var TRACE_PATH = ${scriptSafeJson(tracePathOf(runId))};
  var TITLE = ${scriptSafeJson(titleOf(runId))};
  var status = document.getElementById('status');
  var frame = document.getElementById('perfetto');
  function say(text, isError) { status.textContent = text; status.className = isError ? 'error' : ''; }

  // The bearer, if any, rides the fragment: read once, then erased from the address bar.
  var token = '';
  var hash = window.location.hash;
  if (hash && hash.length > 1) {
    var params = new URLSearchParams(hash.slice(1));
    token = params.get('token') || '';
    try { history.replaceState(null, '', window.location.pathname + window.location.search); } catch (e) { /* the fragment stays; nothing else changes */ }
  }

  var posted = false;
  function onPong(event) {
    if (event.source !== frame.contentWindow || event.data !== 'PONG') return;
    if (posted) return;
    posted = true;
    window.clearInterval(ping);
    window.removeEventListener('message', onPong);
    say('Perfetto is ready; fetching the trace of run ' + RUN_ID + ' …');
    var headers = token ? { Authorization: 'Bearer ' + token } : {};
    fetch(TRACE_PATH, { headers: headers, credentials: 'omit' })
      .then(function (response) {
        if (response.status === 401) {
          throw new Error('401: this trace needs a bearer token — reopen this page as …/perfetto#token=<the run\\'s token>');
        }
        if (!response.ok) throw new Error('the trace answered HTTP ' + response.status);
        return response.arrayBuffer();
      })
      .then(function (buffer) {
        frame.contentWindow.postMessage({ perfetto: { buffer: buffer, title: TITLE, fileName: 'detox-run-' + RUN_ID + '.json' } }, ORIGIN);
        say(TITLE + ' — ' + buffer.byteLength + ' bytes posted to Perfetto; the trace stays in this browser. Off localhost, Perfetto first asks once whether to open it.');
      })
      .catch(function (err) { say(String(err && err.message ? err.message : err), true); });
  }
  window.addEventListener('message', onPong);
  var ping = window.setInterval(function () {
    if (frame.contentWindow) frame.contentWindow.postMessage('PING', ORIGIN);
  }, 250);
})();
`;
}

function tracePathOf(runId: string): string {
  return `/v1/runs/${encodeURIComponent(runId)}/trace`;
}

function titleOf(runId: string): string {
  return `detox run ${runId}`;
}

/** The viewer page for a well-formed run id — any id: the page is not an oracle for which runs exist. */
export function renderPerfettoViewer(runId: string): PerfettoViewerPage {
  const js = script(runId);
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="referrer" content="no-referrer">
<title>${escapeHtml(titleOf(runId))}</title>
<style>${STYLE}</style>
</head>
<body>
<div id="status">Waiting for ${escapeHtml(PERFETTO_UI_ORIGIN)} … (off localhost, Perfetto asks once whether to trust this page as a trace source; answer Always.)</div>
<iframe id="perfetto" src="${escapeHtml(PERFETTO_UI_ORIGIN)}/#!/?mode=embedded" allow="clipboard-write" title="Perfetto"></iframe>
<script>${js}</script>
</body>
</html>
`;
  const csp = [
    "default-src 'none'",
    `script-src ${sha256(js)}`,
    `style-src ${sha256(STYLE)}`,
    "connect-src 'self'",
    `frame-src ${PERFETTO_UI_ORIGIN}`,
    "base-uri 'none'",
    "form-action 'none'",
  ].join('; ');
  return { html, csp };
}
