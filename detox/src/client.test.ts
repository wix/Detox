import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * `client.ts` is mostly types; its only executable is `connect()`, a thin
 * delegate to `connectSession`. Covered here in isolation — `connectSession`
 * itself (the WebSocket handshake, device handles, wire-progress routing)
 * belongs to `client/session.ts`, out of this file's scope.
 */
const connectSessionMock = vi.fn();

vi.mock('./client/session', () => ({
  connectSession: (...args: unknown[]): unknown => connectSessionMock(...args) as unknown,
}));

describe('connect', () => {
  beforeEach(() => {
    connectSessionMock.mockReset();
  });

  it('delegates to connectSession with exactly the given options', async () => {
    const { connect } = await import('./client');
    const fakeDetox = { disconnect: vi.fn() };
    connectSessionMock.mockResolvedValue(fakeDetox);

    const options = { server: 'ws://localhost:3456' };
    const result = await connect(options);

    expect(connectSessionMock).toHaveBeenCalledTimes(1);
    expect(connectSessionMock).toHaveBeenCalledWith(options);
    expect(result).toBe(fakeDetox);
  });

  it('rejects (does not throw) when connectSession rejects, so connect(...).catch(...) is reachable', async () => {
    const { connect } = await import('./client');
    const failure = new Error('could not connect');
    connectSessionMock.mockRejectedValue(failure);

    await expect(connect({ server: 'ws://localhost:3456' })).rejects.toBe(failure);
  });
});

describe('DetoxNotImplementedError', () => {
  it('carries the DETOX_NOT_IMPLEMENTED code and a sensible default message', async () => {
    const { DetoxNotImplementedError } = await import('./client');
    const { DetoxErrorCode } = await import('./client/errors');

    const error = new DetoxNotImplementedError();

    expect(error.name).toBe('DetoxNotImplementedError');
    expect(error.code).toBe(DetoxErrorCode.DETOX_NOT_IMPLEMENTED);
    expect(error.message).toBe('not implemented yet');
  });

  it('accepts a custom message', async () => {
    const { DetoxNotImplementedError } = await import('./client');

    const error = new DetoxNotImplementedError('android support is not implemented yet');

    expect(error.message).toBe('android support is not implemented yet');
  });
});
