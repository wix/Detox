/**
 * Payload materialization (spec 006): payloads cross the wire as JSON values,
 * and the server turns a value into a file the frozen native can read — always server-local,
 * so a client path never crosses the wire, which is what makes the shape relay-safe.
 * @issue DTX-6021: lifetime is the caller's contract — a materialized payload lives at least as
 * long as the app handle its launch/delivery belongs to, and is removed when that handle dies.
 */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { DetoxError, DetoxErrorCode } from '@detox-remote/core';

/** @issue DTX-6034: boundary-exact — exactly this many UTF-8 bytes passes, one more is a typed refusal. */
export const PAYLOAD_VALUE_MAX_BYTES = 1_048_576;

/** The two payload kinds that materialize to files (the `url` form stays argv-only). */
export type PayloadKind = 'userNotification' | 'userActivity';

/**
 * Serializes a payload value and enforces the byte cap. Refusals are the caller's mistake
 * (`DETOX_INVALID_ARGUMENT`), before any side effect — the launch path validates every option
 * before it may terminate a running instance.
 */
export function serializePayloadValue(kind: PayloadKind, value: unknown): string {
  let json: string | undefined;
  try {
    json = JSON.stringify(value);
  } catch (err) {
    // A wire value can never throw here, but a direct embedder can hand a cyclic object or a
    // BigInt — same refusal. The message names only the payload, not the calling verb: this
    // path serves both launchApp and live delivery.
    throw new DetoxError(`payload "${kind}" is not a JSON-serializable value`, {
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: kind },
      cause: err,
    });
  }
  if (json === undefined) {
    throw new DetoxError(`payload "${kind}" is not a JSON-serializable value`, {
      code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
      details: { parameter: kind },
    });
  }
  const bytes = Buffer.byteLength(json, 'utf8');
  if (bytes > PAYLOAD_VALUE_MAX_BYTES) {
    throw new DetoxError(
      `payload "${kind}" serializes to ${String(bytes)} bytes — over the ` +
        `${String(PAYLOAD_VALUE_MAX_BYTES)}-byte (1 MiB) cap`,
      {
        code: DetoxErrorCode.DETOX_INVALID_ARGUMENT,
        details: { parameter: kind, bytes, maxBytes: PAYLOAD_VALUE_MAX_BYTES },
      },
    );
  }
  return json;
}

/** One materialized payload file and the disposal that keeps v20's leak dead. */
export interface MaterializedPayload {
  /** Absolute server-local path — what argv / the frozen frame carries. */
  readonly path: string;
  /** Removes the file and its directory. Idempotent (`rm -rf` semantics). */
  dispose(): Promise<void>;
}

/** A dir per payload, not shared — file names are constant per kind, and two concurrent launches sharing a dir would overwrite each other. */
export async function materializePayload(kind: PayloadKind, json: string): Promise<MaterializedPayload> {
  const dir = await mkdtemp(path.join(tmpdir(), 'detox-payload-'));
  const file = path.join(dir, `${kind}.json`);
  await writeFile(file, json, 'utf8');
  // @issue DTX-6037: memoized — a successful launch leaves two live disposers (the undo-ledger
  // entry and the death hook), and two concurrent rm -rf's of one tree can trip into ENOTEMPTY.
  let removing: Promise<void> | undefined;
  return {
    path: file,
    dispose: () => (removing ??= rm(dir, { recursive: true, force: true })),
  };
}

/** @issue DTX-6036: disposal for death hooks — fire-and-forget, logged-never-thrown. */
export function disposeQuietly(payload: MaterializedPayload): void {
  payload.dispose().catch((err: unknown) => {
    console.error('[server] payload file cleanup failed:', err);
  });
}
