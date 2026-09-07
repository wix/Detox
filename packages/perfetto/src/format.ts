/**
 * The text views' shared vocabulary (spec 013): a node's line name (the
 * trace's own, so the two views agree), its duration column, and a tick's
 * `level│` / `stream│` prefix.
 */
import { describeNode, type TraceLogLine } from './trace';
import type { TreeNode } from './tree';

export const INDENT = '  ';

/** The name a node's line wears — human, and marked `✗` (with the wire code) when it ended `ok: false`. */
export function lineNameOf(node: TreeNode): string {
  if (node.begin === undefined) return node.id;
  return describeNode(node.begin, node.end);
}

/** The same name without the failure mark — an ancestor in a failure's chain. */
export function plainNameOf(node: TreeNode): string {
  if (node.begin === undefined) return node.id;
  return describeNode(node.begin);
}

/** `<1 s` in whole milliseconds, `≥1 s` in seconds with one decimal. */
export function formatDuration(ms: number): string {
  const clamped = Math.max(0, ms);
  return clamped < 1000 ? `${String(Math.round(clamped))} ms` : `${(clamped / 1000).toFixed(1)} s`;
}

/** A node's duration column, or `… (open)` for one the file never ended. */
export function durationOf(node: TreeNode): string {
  if (node.begin === undefined) return '';
  if (node.end === undefined) return '… (open)';
  return formatDuration(node.end.ts - node.begin.ts);
}

/** A tick's prefix: the app's or a child's stream when the line carries one, else its level. */
export function tickPrefixOf(line: TraceLogLine): string {
  const stream = line.fields?.stream;
  return typeof stream === 'string' ? stream : line.level;
}

/** `<prefix>│ <msg>` — a msg with newlines of its own continues under the prefix's width. */
export function formatTick(line: TraceLogLine): string {
  const prefix = `${tickPrefixOf(line)}│ `;
  const [first, ...rest] = (line.msg ?? line.node.name).split('\n');
  return [`${prefix}${first}`, ...rest.map((row) => `${' '.repeat(prefix.length)}${row}`)].join('\n');
}

/** Lines laid out in two columns: the name (indented), the right-aligned duration. */
export function layoutColumns(rows: ReadonlyArray<{ text: string; duration: string }>): string[] {
  const nameWidth = rows.reduce((width, row) => (row.duration === '' ? width : Math.max(width, row.text.length)), 0);
  const durationWidth = rows.reduce((width, row) => Math.max(width, row.duration.length), 0);
  return rows.map((row) => (row.duration === '' ? row.text : `${row.text.padEnd(nameWidth + 2)}${row.duration.padStart(durationWidth)}`));
}
