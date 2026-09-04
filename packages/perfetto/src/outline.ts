/**
 * The outline (spec 013): the run as indented text — the declared tree,
 * the trace's own names, a right-aligned duration column, `✗` on what
 * ended `ok: false`. The connection is the heading, never a line; a
 * foreign hop is a heading of its own, so a relay run reads as sections.
 * Repeated leaf siblings collapse (`tap by.text("x") ×12  0.6–1.0 s`);
 * narration ticks print only under `--all`, as `level│ …` (`stdout│ …`
 * for a stream).
 */
import { describeConnection } from './names';
import type { TraceLogLine } from './trace';
import { buildTree, isConnectionNode, type TreeNode } from './tree';
import { INDENT, durationOf, formatDuration, formatTick, layoutColumns, lineNameOf } from './format';

export interface OutlineOptions {
  runId?: string;
  /** Print the narration ticks under their nodes. */
  all?: boolean;
  /** Print the run and hop headings (off for a `--under` subtree, whose root is the first line). */
  headings?: boolean;
}

/** Leaf siblings collapse from this many consecutive same-named nodes on. */
export const COLLAPSE_FROM = 3;

interface Row {
  text: string;
  duration: string;
}

/** `run <id> · <name> · <startedAt> · <duration>` for a hop's connection node. */
function connectionHeading(conn: TreeNode, runId: string | undefined): string {
  const parts: string[] = [];
  if (conn.begin !== undefined) {
    // `<runId> from <remote>` when the file names it; the id the caller has in hand otherwise.
    const name = describeConnection(conn.begin.fields, conn.begin.node.name);
    parts.push(`run ${runId === undefined || name.startsWith(runId) ? name : `${runId} · ${name}`}`);
    parts.push(new Date(conn.begin.ts).toISOString());
    parts.push(durationOf(conn));
  } else {
    parts.push(`run ${runId ?? conn.id}`);
  }
  return parts.join(' · ');
}

/** The rows of `node`'s children (and, under `--all`, its ticks), with leaf-sibling runs collapsed. */
function rowsOf(node: TreeNode, depth: number, all: boolean, rows: Row[]): void {
  if (all) for (const tick of node.logs) rows.push({ text: `${INDENT.repeat(depth)}${formatTick(tick)}`, duration: '' });
  const children = node.children;
  let i = 0;
  while (i < children.length) {
    const child = children[i];
    const name = lineNameOf(child);
    // A collapsible run: same name, no children — and, under --all, no ticks
    // either (a collapsed row prints none, and the app's own lines are ticks).
    const leaf = (node: TreeNode): boolean => node.children.length === 0 && (!all || node.logs.length === 0);
    let run = i + 1;
    while (run < children.length && leaf(child) && leaf(children[run]) && lineNameOf(children[run]) === name) run++;
    const count = run - i;
    if (count >= COLLAPSE_FROM) {
      const group = children.slice(i, run);
      const spans = group.filter((n) => n.begin !== undefined && n.end !== undefined).map((n) => (n.end as TraceLogLine).ts - (n.begin as TraceLogLine).ts);
      const range = spans.length === 0 ? '' : spans.length === group.length ? rangeOf(spans) : `${rangeOf(spans)} (${String(group.length - spans.length)} open)`;
      rows.push({ text: `${INDENT.repeat(depth)}${name} ×${String(count)}`, duration: range });
      i = run;
      continue;
    }
    rows.push({ text: `${INDENT.repeat(depth)}${name}`, duration: durationOf(child) });
    rowsOf(child, depth + 1, all, rows);
    i += 1;
  }
}

/** `0.6–1.0 s` / `600–900 ms`: one unit, the longer span's, said once. */
function rangeOf(spans: number[]): string {
  const min = Math.max(0, Math.min(...spans));
  const max = Math.max(0, Math.max(...spans));
  if (min === max) return formatDuration(min);
  if (max >= 1000) return `${(min / 1000).toFixed(1)}–${(max / 1000).toFixed(1)} s`;
  return `${String(Math.round(min))}–${String(Math.round(max))} ms`;
}

export function toOutline(lines: readonly TraceLogLine[], options: OutlineOptions = {}): string {
  const { all = false, headings = true } = options;
  const tree = buildTree(lines);
  const out: string[] = [];
  const flush = (rows: Row[]): void => {
    out.push(...layoutColumns(rows));
    rows.length = 0;
  };

  // Sections: the local hop first (its connection node's heading), then each foreign hop.
  const hops = new Map<string | undefined, TreeNode[]>();
  for (const root of tree.roots) {
    const list = hops.get(root.hop) ?? [];
    list.push(root);
    hops.set(root.hop, list);
  }
  const ordered = [...hops.entries()].sort(([a], [b]) => (a === undefined ? -1 : b === undefined ? 1 : a.localeCompare(b)));
  const rows: Row[] = [];
  for (const [hop, roots] of ordered) {
    const conn = roots.find(isConnectionNode);
    if (headings) {
      if (hop === undefined) out.push(conn !== undefined ? connectionHeading(conn, options.runId) : `run ${options.runId ?? ''}`.trimEnd());
      else out.push(hop);
    }
    // The section is the implicit root: the connection's own ticks, then every
    // root of the hop at depth 0 — one sibling list, so leaf runs collapse here too.
    const section: TreeNode = { id: hop ?? '', logs: conn?.logs ?? [], children: roots.filter((root) => !isConnectionNode(root)) };
    rowsOf(section, 0, all, rows);
    flush(rows);
  }
  return `${out.join('\n')}\n`;
}
