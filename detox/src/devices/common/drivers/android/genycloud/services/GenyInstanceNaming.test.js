jest.mock('../../../../../../utils/getWorkerId');

describe('Genymotion-Cloud instance unique-name strategy', () => {
  let getWorkerId;
  let now;

  function uut() {
    const GenyInstanceNaming = require('./GenyInstanceNaming');
    return new GenyInstanceNaming(() => now);
  }

  beforeEach(() => {
    getWorkerId = require('../../../../../../utils/getWorkerId');
    process.env.DETOX_START_TIMESTAMP = '123456';
    now = 123534;
  });

  afterAll(() => {
    delete process.env.DETOX_START_TIMESTAMP;
  });

  it('should generate a session-scope unique name', () => {
    expect(uut().generateName()).toMatch(/^Detox-123456\./);
  });

  it('should generate an instance-scope unique name based on jest-worker IDs', () => {
    getWorkerId.mockReturnValue('777');
    expect(uut().generateName()).toEqual('Detox-123456.777');
  });

  it('should generate an instance-scope unique name based on time delta, as a fallback', () => {
    getWorkerId.mockReturnValue('');
    expect(uut().generateName()).toEqual('Detox-123456.78');
  });

  it('should generate an instance-scope unique name', () => {
    getWorkerId.mockReturnValue('');

    const name1 = uut().generateName();
    now = now + 1;
    const name2 = uut().generateName();

    expect(name1).not.toEqual(name2);
  });

  it('should accept names with the correct timestamp and matching worker id', () => {
    getWorkerId.mockReturnValue('10');
    expect(uut().isFamilial('Detox-123456.10')).toEqual(true);
  });

  it('should deny names with the correct timestamp and incorrect worker id', () =>
    expect(uut().isFamilial('Detox-123456.10')).toEqual(false));

  it('should deny names with the incorrect timestamp', () =>
    expect(uut().isFamilial('Detox-123457.10')).toEqual(false));

  it('should deny names not starting with "Detox-"', () =>
    expect(uut().isFamilial('Dtx-123456.10')).toEqual(false));

  it('should deny names in wrong sections orders', () =>
    expect(uut().isFamilial('123456-Detox-.10')).toEqual(false));

  it('should deny names with the wrong prefix', () =>
    expect(uut().isFamilial('_Detox-123456.10')).toEqual(false));

  it('should deny names not containing a dot separator', () =>
    expect(uut().isFamilial('Detox-123456-10')).toEqual(false));

  it('should have a default now-provider', () => {
    const GenyInstanceNaming = require('./GenyInstanceNaming');
    expect(new GenyInstanceNaming().generateName()).toMatch(/^Detox-/);
  });
});
