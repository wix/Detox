describe('Genymotion-cloud authentication service', () => {
  let exec;
  let uut;
  beforeEach(() => {
    const GenyCloudExec = jest.genMockFromModule('../exec/GenyCloudExec');
    exec = new GenyCloudExec();

    const GenyAuthService = require('./GenyAuthService');
    uut = new GenyAuthService(exec);
  });

  const givenLoginEmail = (email) => exec.whoAmI.mockResolvedValue({
    auth: {
      email,
    },
  });
  const givenLoggedOut = () => givenLoginEmail(null);

  it('should return logged-in user email', async () => {
    givenLoginEmail('mock@wix.com');

    const result = await uut.getLoginEmail();
    expect(result).toEqual('mock@wix.com');
  });

  it('should return null if logged-out', async () => {
    givenLoggedOut();

    const result = await uut.getLoginEmail();
    expect(result).toEqual(null);
  });
});
