// The workspace-internal root entry. The published `.` entry is not built
// from this file: esbuild bundles `packages/compat/src/index.ts` into
// dist/index.js, so `require('detox')` is the compat surface.
import { DetoxClientPeer } from './DetoxClientPeer';
import { createDetoxClient } from './createDetoxClient';

export { DetoxClientPeer, createDetoxClient };
export type { DetoxClient } from './createDetoxClient';
