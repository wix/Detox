/**
 * The relay's node roster — `--nodes <file>`, a JSON array of
 * `{ name, url, token? }` (spec 008; token optional because auth is
 * opt-in). A file, never argv: argv is readable by every local process, and
 * tokens are secrets. Auth is hop-pairwise: the relay presents each node's
 * own token on its own upstream handshake, and a token may be absent when
 * that node runs auth-off.
 *
 * Zero nodes, an unreadable file, or a malformed entry is a startup failure
 * — the error text never echoes a token value, only which entry and which
 * field is wrong.
 */

export interface RelayNodeConfig {
  /** Operator-chosen name; appears in logs and `details.nodes[].node`. */
  readonly name: string;
  /** The node's ws(s) URL — the same address a direct client would dial. */
  readonly url: string;
  /** The node's bearer token, presented by the relay upstream — absent when that node runs auth-off. */
  readonly token?: string;
}

function fail(reason: string): never {
  throw new Error(`invalid --nodes config: ${reason}`);
}

/**
 * Parses and validates the nodes file's text. Pure — the CLI reads the file,
 * so units can cover every refusal without a filesystem.
 */
export function parseNodesConfig(text: string): RelayNodeConfig[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('not valid JSON (expected [{ "name", "url", "token" }, …])');
  }
  if (!Array.isArray(parsed)) fail('expected a JSON array of node entries');
  if (parsed.length === 0) fail('zero nodes — a relay over nothing is a misconfiguration');

  const seen = new Set<string>();
  return parsed.map((entry, index) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      fail(`entry ${String(index)} is not an object`);
    }
    const { name, url, token } = entry as Partial<Record<'name' | 'url' | 'token', unknown>>;
    if (typeof name !== 'string' || name.length === 0) {
      fail(`entry ${String(index)}: "name" must be a non-empty string`);
    }
    // Names key the aggregate's `details.nodes` and the logs — a duplicate
    // would make two nodes indistinguishable everywhere they surface.
    if (seen.has(name)) fail(`duplicate node name "${name}"`);
    seen.add(name);
    if (typeof url !== 'string' || !/^wss?:\/\//i.test(url)) {
      fail(`entry ${String(index)} ("${name}"): "url" must be a ws:// or wss:// URL`);
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      fail(`entry ${String(index)} ("${name}"): "url" is not a valid URL`);
    }
    // @issue DTX-7039: a userinfo-bearing URL smuggles a secret into every formatted spot — use "token".
    if (parsedUrl.username !== '' || parsedUrl.password !== '') {
      fail(`entry ${String(index)} ("${name}"): "url" must not embed credentials — use the "token" field`);
    }
    // @issue DTX-7040: absent is a choice (auth-off); empty is refused, not "no auth" or a real credential.
    if (token !== undefined && (typeof token !== 'string' || token.length === 0)) {
      fail(`entry ${String(index)} ("${name}"): "token" must be a non-empty string when present — omit it for a node with auth off`);
    }
    return token === undefined ? { name, url } : { name, url, token };
  });
}

/**
 * The self-dial guard: a roster entry naming the relay's own address would
 * recurse (a session per hop, a stall clock each, sockets multiplying), so
 * it is refused at startup as a typed misconfiguration instead of being
 * discovered later as resource exhaustion. A literal match by design:
 * `selfHosts` carries the spellings the relay actually answers on (loopback
 * names, the bind address, the machine's own interface addresses under a
 * wildcard bind); a DNS alias of this machine is out of reach here and
 * stays the operator's own rope.
 */
export function findSelfDialNode(
  nodes: readonly RelayNodeConfig[],
  boundPort: number,
  selfHosts: ReadonlySet<string>,
): RelayNodeConfig | undefined {
  return nodes.find((node) => {
    let url: URL;
    try {
      url = new URL(node.url);
    } catch {
      return false; // parseNodesConfig refused malformed URLs already
    }
    const port = url.port === '' ? (url.protocol === 'wss:' ? 443 : 80) : Number(url.port);
    return port === boundPort && selfHosts.has(url.hostname.toLowerCase());
  });
}
