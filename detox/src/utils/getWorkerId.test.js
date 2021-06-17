const getWorkerId = require('./getWorkerId');

describe('getWorkerId', () => {
  it('should return process.env.JEST_WORKER_ID', async () => {
    expect(process.env.JEST_WORKER_ID).not.toBe(undefined);
    expect(getWorkerId()).toBe(process.env.JEST_WORKER_ID);
  });
});

