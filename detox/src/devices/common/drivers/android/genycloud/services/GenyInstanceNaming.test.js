jest.mock('../../../../../../../internals', () => ({}));

describe('Genymotion-Cloud instance unique-name strategy', () => {
  let sessionId, workerId;

  function uut() {
    const GenyInstanceNaming = require('./GenyInstanceNaming');
    return new GenyInstanceNaming();
  }

  beforeEach(() => {
    Object.defineProperty(require('../../../../../../../internals'), 'session', {
      get: () => ({ id: sessionId, workerId }),
    });
  });

  it('should generate a session-scope unique name', () => {
    sessionId = '71dd7a96-bdd7-480a-b4a0-fd265fb208cd';
    workerId = 1;

    expect(uut().generateName()).toBe('Detox.71dd7a96-bdd7-480a-b4a0-fd265fb208cd.1');
  });

  it('should accept only the same session and worker id as a familial device', () => {
    sessionId = 'session';
    workerId = 3;

    expect(uut().isFamilial('Detox.session.3')).toEqual(true);
    expect(uut().isFamilial('Detox.session.2')).toEqual(false);
  });
});
