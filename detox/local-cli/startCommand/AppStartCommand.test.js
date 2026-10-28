describe('AppStartCommand', () => {
  let AppStartCommand;

  beforeEach(() => {
    jest.mock('../../src/utils/logger');
    jest.mock('../../internals', () => ({ log: require('../../src/utils/logger') }));

    AppStartCommand = require('./AppStartCommand');
  });

  it('should resolve when the command is terminated by a signal', async () => {
    const command = new AppStartCommand({ cmd: 'node --eval="setTimeout(() => {}, 10000)"' });
    const execution = command.execute();

    await command.stop();
    await expect(execution).resolves.toBeUndefined();
  });
});
