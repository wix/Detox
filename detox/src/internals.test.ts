import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `internals.ts` is mostly types; its only executable is `init()`, a thin
 * delegate to `initSession`. Covered here in isolation — `initSession`
 * itself (the WebSocket handshake, device handles, wire-progress routing)
 * belongs to `internals/session.ts`, out of this file's scope.
 */
const initSessionMock = vi.fn();

vi.mock('./internals/session', () => ({
  initSession: (...args: unknown[]): unknown => initSessionMock(...args) as unknown,
}));

describe('init', () => {
  beforeEach(() => {
    initSessionMock.mockReset();
  });

  it('delegates to initSession with exactly the given options', async () => {
    const { init } = await import('./internals');
    const fakeDetox = { disconnect: vi.fn() };
    initSessionMock.mockResolvedValue(fakeDetox);

    const options = { server: 'ws://localhost:3456' };
    const result = await init(options);

    expect(initSessionMock).toHaveBeenCalledTimes(1);
    expect(initSessionMock).toHaveBeenCalledWith(options);
    expect(result).toBe(fakeDetox);
  });

  it('rejects (does not throw) when initSession rejects, so init(...).catch(...) is reachable', async () => {
    const { init } = await import('./internals');
    const failure = new Error('could not connect');
    initSessionMock.mockRejectedValue(failure);

    await expect(init({ server: 'ws://localhost:3456' })).rejects.toBe(failure);
  });
});

describe('DetoxNotImplementedError', () => {
  it('carries the DETOX_NOT_IMPLEMENTED code and a sensible default message', async () => {
    const { DetoxNotImplementedError } = await import('./internals');
    const { DetoxErrorCode } = await import('./internals/errors');

    const error = new DetoxNotImplementedError();

    expect(error.name).toBe('DetoxNotImplementedError');
    expect(error.code).toBe(DetoxErrorCode.DETOX_NOT_IMPLEMENTED);
    expect(error.message).toBe('not implemented yet');
  });

  it('accepts a custom message', async () => {
    const { DetoxNotImplementedError } = await import('./internals');

    const error = new DetoxNotImplementedError('android support is not implemented yet');

    expect(error.message).toBe('android support is not implemented yet');
  });
});
