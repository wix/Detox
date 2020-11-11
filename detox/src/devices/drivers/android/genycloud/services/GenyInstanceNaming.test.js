describe('Genymotion-Cloud instance unique-name strategy', () => {
  let now;
  let uut;
  beforeEach(() => {
    process.env.DETOX_START_TIMESTAMP = '123456';

    now = 123534;
    const nowProvider = () => now;

    const GenyInstanceNaming = require('./GenyInstanceNaming');
    uut = new GenyInstanceNaming(nowProvider);
  });

  afterAll(() => {
    delete process.env.DETOX_START_TIMESTAMP;
  })

  it('should generate a session-scope unique name', () =>
    expect(uut.generateName()).toEqual('Detox-123456.78'));

  it('should generate an instance-scope unique name', () => {
    const name1 = uut.generateName();
    now = now + 1;
    const name2 = uut.generateName();

    expect(name1).not.toEqual(name2);
  });

  it('should accept names with the correct timestamp as valid', () =>
    expect(uut.isFamilial('Detox-123456.10')).toEqual(true));

  it('should deny names with the incorrect timestamp', () =>
    expect(uut.isFamilial('Detox-123457.10')).toEqual(false));

  it('should deny names not starting with "Detox-"', () =>
    expect(uut.isFamilial('Dtx-123456.10')).toEqual(false));

  it('should deny names in wrong sections orders', () =>
    expect(uut.isFamilial('123456-Detox-.10')).toEqual(false));

  it('should deny names with the wrong prefix', () =>
    expect(uut.isFamilial('_Detox-123456.10')).toEqual(false));

  it('should deny names not containing a dot separator', () =>
    expect(uut.isFamilial('Detox-123456-10')).toEqual(false));

  it('should have a default now-provider', () => {
    const GenyInstanceNaming = require('./GenyInstanceNaming');
    uut = new GenyInstanceNaming(undefined);
    expect(uut.generateName().startsWith('Detox-')).toEqual(true);
  });
});
