/**
 * The declared tree of a connection log (spec 013): every node the file
 * begins, under the parent its begin line names, its ticks in file order,
 * its children in begin order. Nothing is inferred from time; `seq`
 * decides everything, as in the trace projection. The connection nodes
 * (`conn`, `<hop>/conn`) are the implicit roots of their hop — the views
 * print headings for them, never lines.
 */
import type { TraceLogLine } from './trace';
import { hopOf } from './trace';

export interface TreeNode {
  id: string;
  /** Absent for a node the file never began (a `log` or `end` under an unknown id). */
  begin?: TraceLogLine;
  end?: TraceLogLine;
  /** The `log` lines under this node, in file order. */
  logs: TraceLogLine[];
  children: TreeNode[];
  parent?: TreeNode;
  /** The foreign hop this node belongs to (spec 008's `<node>/…` ids); `undefined` for the local hop. */
  hop?: string;
}

export interface LogTree {
  /** Nodes with no parent in the file (the connection nodes, and orphans), in begin order. */
  roots: TreeNode[];
  nodes: Map<string, TreeNode>;
}

/** The first line that mentions the node — its position among siblings. */
export function seqOf(node: TreeNode): number {
  return node.begin?.seq ?? node.logs[0]?.seq ?? node.end?.seq ?? Number.MAX_SAFE_INTEGER;
}

/** Whether a node is a hop's own connection node — the implicit root the views do not print. */
export function isConnectionNode(node: TreeNode): boolean {
  return node.id === 'conn' || node.id.endsWith('/conn');
}

export function buildTree(lines: readonly TraceLogLine[]): LogTree {
  const nodes = new Map<string, TreeNode>();
  const nodeOf = (id: string): TreeNode => {
    let node = nodes.get(id);
    if (node === undefined) {
      node = { id, logs: [], children: [], hop: hopOf(id) };
      nodes.set(id, node);
    }
    return node;
  };
  for (const line of lines) {
    const node = nodeOf(line.node.id);
    if (line.kind === 'begin') {
      if (node.begin === undefined) node.begin = line;
    } else if (line.kind === 'end') {
      if (node.begin !== undefined && node.end === undefined) node.end = line;
    } else {
      node.logs.push(line);
    }
  }
  // Parents from the begin lines, then children in begin order; a parent the
  // file never began still parents (an orphan chain), so nothing is dropped.
  const roots: TreeNode[] = [];
  for (const node of nodes.values()) {
    const parentId = node.begin?.node.parent;
    const parent = parentId === undefined ? undefined : nodes.get(parentId);
    if (parent !== undefined && parent !== node) {
      node.parent = parent;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const bySeq = (a: TreeNode, b: TreeNode): number => seqOf(a) - seqOf(b);
  roots.sort(bySeq);
  for (const node of nodes.values()) node.children.sort(bySeq);
  return { roots, nodes };
}

/** Every line of `node` and its descendants, in file order — the `--under … --json` cut. */
export function subtreeLines(lines: readonly TraceLogLine[], node: TreeNode): TraceLogLine[] {
  const ids = new Set<string>();
  const stack = [node];
  while (stack.length > 0) {
    const current = stack.pop() as TreeNode;
    ids.add(current.id);
    stack.push(...current.children);
  }
  return lines.filter((line) => ids.has(line.node.id));
}

/** The chain from the outermost ancestor down to `node` itself. */
export function ancestryOf(node: TreeNode): TreeNode[] {
  const chain: TreeNode[] = [];
  for (let current: TreeNode | undefined = node; current !== undefined; current = current.parent) chain.unshift(current);
  return chain;
}
