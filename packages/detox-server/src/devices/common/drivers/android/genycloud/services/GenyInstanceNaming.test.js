jest.mock('../../../../../../../internals', () => ({}));

describe('Genymotion-Cloud instance unique-name strategy', () => {
  let sessionId, workerId;

  function uut() {
    const GenyInstanceNaming = require('./GenyInstanceNaming');
    return new GenyInstanceNaming();
  }

  beforeEach(() => {
    Object.defineProperties(require('../../../../../../../internals'), {
      session: { get: () => ({ id: sessionId }) } ,
      worker: { get: () => ({ id: workerId }) } ,
    });
  });

  it('should generate a session-scope unique name', () => {
    sessionId = '71dd7a96-bdd7-480a-b4a0-fd265fb208cd';
    workerId = 'worker-1';

    expect(uut().generateName()).toBe('Detox.71dd7a96-bdd7-480a-b4a0-fd265fb208cd.worker-1');
  });

  it('should accept only the same session and worker id as a familial device', () => {
    sessionId = 'session';
    workerId = 'worker-3';

    expect(uut().isFamilial('Detox.session.worker-3')).toEqual(true);
    expect(uut().isFamilial('Detox.session.worker-2')).toEqual(false);
  });
});
