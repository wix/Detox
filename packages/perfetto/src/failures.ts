/**
 * The failure-first cut (spec 013): one block per innermost node that
 * ended `ok: false` — its ancestor chain from the outermost node down (the
 * connection is never a line), the node itself with its `✗`, its error,
 * and every narration tick that landed under it or its ancestors between
 * its begin and its end — in `seq` order, blocks separated by a blank
 * line. A projection, not a filter: `?level=warn` would drop the
 * ancestors a diagnosis needs. A run with no such node says so.
 */
import type { TraceLogLine } from './trace';
import { ancestryOf, buildTree, isConnectionNode, seqOf, type TreeNode } from './tree';
import { INDENT, durationOf, formatTick, layoutColumns, lineNameOf, plainNameOf } from './format';

export interface FailuresOptions {
  runId?: string;
}

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Whether the node ended `ok: false` (a synthesized end counts: the file says it did not end well). */
export function failed(node: TreeNode): boolean {
  return node.begin !== undefined && node.end !== undefined && node.end.fields?.ok === false;
}

function hasFailedDescendant(node: TreeNode): boolean {
  return node.children.some((child) => failed(child) || hasFailedDescendant(child));
}

/** The innermost failed nodes, in file order. */
export function innermostFailures(lines: readonly TraceLogLine[]): TreeNode[] {
  const tree = buildTree(lines);
  const found: TreeNode[] = [];
  const walk = (node: TreeNode): void => {
    if (failed(node) && !hasFailedDescendant(node)) found.push(node);
    for (const child of node.children) walk(child);
  };
  for (const root of tree.roots) walk(root);
  return found.sort((a, b) => seqOf(a) - seqOf(b));
}

/** The error a failed end carries, as lines: `Name: message` for a step, `error <code>: message` for an rpc, `reason: …` for a synthesized end. */
export function errorLinesOf(node: TreeNode): string[] {
  const fields = node.end?.fields;
  if (!fields) return [];
  const error = isDict(fields.error) ? fields.error : undefined;
  const out: string[] = [];
  if (error !== undefined) {
    const code = typeof error.code === 'number' ? error.code : undefined;
    const name = typeof error.name === 'string' ? error.name : undefined;
    const message = typeof error.message === 'string' ? error.message : '';
    const head = code !== undefined ? `error ${String(code)}` : name ?? 'error';
    const [first, ...rest] = message.split('\n');
    out.push(`${head}: ${first}`, ...rest);
    // The wire error's structured details (the query, a pool refusal's
    // holders): the part a message alone conceals, on one line.
    if (error.data !== undefined) out.push(`data: ${JSON.stringify(error.data)}`);
  }
  if (typeof fields.exitCode === 'number' && fields.exitCode !== 0) out.push(`exit code ${String(fields.exitCode)}`);
  if (typeof fields.signal === 'string') out.push(`signal: ${fields.signal}`);
  if (typeof fields.reason === 'string') out.push(`reason: ${fields.reason}`);
  if (error === undefined && typeof fields.reason !== 'string' && typeof node.end?.msg === 'string') out.push(node.end.msg);
  return out;
}

/** The ticks under `node` or its ancestors that landed between the node's begin and its end, in file order. */
export function ticksAround(node: TreeNode): TraceLogLine[] {
  const begin = node.begin?.seq ?? 0;
  const end = node.end?.seq ?? Number.MAX_SAFE_INTEGER;
  const ticks: TraceLogLine[] = [];
  for (const ancestor of ancestryOf(node)) {
    for (const tick of ancestor.logs) if (tick.seq > begin && tick.seq < end) ticks.push(tick);
  }
  return ticks.sort((a, b) => a.seq - b.seq);
}

export function toFailures(lines: readonly TraceLogLine[], options: FailuresOptions = {}): string {
  const failures = innermostFailures(lines);
  if (failures.length === 0) return `no failures${options.runId !== undefined ? ` in run ${options.runId}` : ''}\n`;
  const blocks: string[] = [];
  for (const node of failures) {
    const chain = ancestryOf(node).filter((n) => !isConnectionNode(n));
    // The ancestors wear no mark here: they ended failed because of the node
    // below them, which is the one line that says `✗`.
    const rows = chain.map((n, depth) => ({ text: `${INDENT.repeat(depth)}${n === node ? lineNameOf(n) : plainNameOf(n)}`, duration: durationOf(n) }));
    const block = layoutColumns(rows);
    const inner = INDENT.repeat(chain.length);
    if (node.hop !== undefined) block.unshift(node.hop);
    for (const line of errorLinesOf(node)) block.push(`${inner}${line}`);
    for (const tick of ticksAround(node)) block.push(`${inner}${formatTick(tick)}`);
    blocks.push(block.join('\n'));
  }
  return `${blocks.join('\n\n')}\n`;
}
