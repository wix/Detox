/**
 * Test scaffolding for the error taxonomy (spec 004) — not product API.
 *
 * Holds the two things every taxonomy assertion needs and no test should
 * restate: capturing a rejection as a value, and the shape invariant that
 * applies to *every* observable Detox failure. What each test asserts on top
 * of that — which class, which code, which details — is the contract, and
 * stays in the accept file.
 */
import assert from 'node:assert/strict';

/** Detox's slice of the code space; see `DetoxErrorCode` in the core package. */
const CODE_RANGE = { min: 2000, max: 2099 } as const;

/** The fields spec 004 puts on every public error. */
export interface DetoxErrorFields {
  readonly name: string;
  readonly message: string;
  readonly code: number;
  readonly details?: Record<string, unknown>;
  readonly cause?: unknown;
}

/**
 * Asserts the shape shared by every observable failure, and narrows the type.
 *
 * Message text is checked for existence and never beyond it: classifying by
 * prose is the anti-pattern spec 004 retires, so a test that read `.message`
 * would be re-introducing it.
 */
export function assertDetoxError(err: unknown, label: string): DetoxErrorFields {
  assert.ok(err instanceof Error, `${label}: expected an Error, got ${typeof err}`);
  const e = err as Partial<DetoxErrorFields> & Error;
  assert.equal(
    typeof e.code,
    'number',
    `${label}: expected a numeric .code on ${e.name}: ${e.message}`,
  );
  const code = e.code as number;
  assert.ok(
    code >= CODE_RANGE.min && code <= CODE_RANGE.max,
    `${label}: expected .code in Detox's ${CODE_RANGE.min}-${CODE_RANGE.max} range, got ${code}`,
  );
  assert.ok(e.message.length > 0, `${label}: expected a human-readable message`);
  return e as DetoxErrorFields;
}

/**
 * One per-node outcome inside a relay's aggregate refusal (spec 008):
 * `details.nodes` — `node` is the operator-configured node name, `code` that
 * node's own refusal code. `message` exists but is prose, and no test reads
 * prose (the spec-004 rule).
 */
export interface NodeOutcome {
  readonly node: string;
  readonly code: number;
}

/**
 * Extracts and shape-checks `details.nodes` from a relay aggregate error.
 * Lives here so the frozen accept file never inline-casts `details`.
 */
export function nodeOutcomesOf(err: DetoxErrorFields, label: string): NodeOutcome[] {
  const nodes = err.details?.nodes;
  assert.ok(Array.isArray(nodes), `${label}: expected details.nodes to be an array`);
  return nodes.map((entry, index) => {
    const candidate = entry as Partial<NodeOutcome>;
    assert.equal(
      typeof candidate.node,
      'string',
      `${label}: details.nodes[${index}].node must be the configured node name`,
    );
    assert.equal(
      typeof candidate.code,
      'number',
      `${label}: details.nodes[${index}].code must be that node's own refusal code`,
    );
    return { node: candidate.node as string, code: candidate.code as number };
  });
}

/** Awaits a promise expected to reject, and hands back the rejection value. */
export async function rejectionOf(promise: Promise<unknown>, label: string): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  assert.fail(`${label}: expected a rejection, got a resolution`);
}
