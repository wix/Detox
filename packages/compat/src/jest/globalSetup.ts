/**
 * `detox/runners/jest/globalSetup` (spec 010's runner contract): v21 has
 * nothing to do before workers exist. The CLI resolved the config once (spec
 * 009's snapshot); the server is not started from here; each worker's
 * first environment setup opens its own session. The module exists
 * because a migrant's jest.config.js names it and it must resolve.
 */
export default async function globalSetup(): Promise<void> {
  // An async no-op, and that is the contract, not a stub.
}
