/**
 * `--under <name>` (spec 013): the nodes a name selects, and the lines of
 * their subtrees. A name matches a step by its own name or its
 * `attrs.fullName`, an rpc by its human name (the trace's) or its bare
 * method, and any node by its id (`step:<id>`, `rpc:<n>`, hop-prefixed).
 * Several matches are several subtrees, in file order.
 */
import { describeRpc } from './names';
import type { TraceLogLine } from './trace';
import { buildTree, seqOf, subtreeLines, type TreeNode } from './tree';
import { lineNameOf } from './format';

type Dict = Record<string, unknown>;

function isDict(value: unknown): value is Dict {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Whether `name` selects `node`. */
export function matchesUnder(node: TreeNode, name: string): boolean {
  if (node.id === name) return true;
  const begin = node.begin;
  if (begin === undefined) return false;
  if (begin.node.name === name) return true;
  const fields = begin.fields;
  if (begin.node.type === 'step') {
    const attrs = isDict(fields?.attrs) ? fields.attrs : undefined;
    return attrs?.fullName === name;
  }
  if (begin.node.type === 'rpc') {
    const method = fields?.method;
    if (typeof method === 'string') {
      if (method === name) return true;
      if (describeRpc(method, fields?.params) === name) return true;
    }
    // The marked name too (`… ✗ 2014`), so a name copied from an outline still selects.
    return lineNameOf(node) === name;
  }
  return false;
}

export interface Selection {
  node: TreeNode;
  lines: TraceLogLine[];
}

/** Every node `name` selects, with its subtree's lines, in file order. */
export function selectUnder(lines: readonly TraceLogLine[], name: string): Selection[] {
  const tree = buildTree(lines);
  const matches = [...tree.nodes.values()].filter((node) => matchesUnder(node, name)).sort((a, b) => seqOf(a) - seqOf(b));
  return matches.map((node) => ({ node, lines: subtreeLines(lines, node) }));
}
