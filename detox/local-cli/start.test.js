const { callCli, buildMockCommand } = require('../__tests__/helpers');

describe('start', () => {
  let cmd;
  let detox;

  beforeEach(() => {
    cmd = null;

    jest.mock('../src/utils/logger');
    jest.mock('../internals', () => {
      const DetoxConfigErrorComposer = require('../src/errors/DetoxConfigErrorComposer');

      const config = {
        apps: {},
        artifacts: {},
        behavior: {},
        commands: [],
        errorComposer: new DetoxConfigErrorComposer(),
        device: {},
        session: {}
      };

      return ({
        config,
        resolveConfig: jest.fn().mockResolvedValue(config),
        log: require('../src/utils/logger')
      });
    });

    detox = require('../internals');
  });

  afterEach(async () => {
    if (cmd) {
      await cmd.clean();
    }
  });

  it('passes argv to resolveConfig', async () => {
    await callCli('./start', 'start -C /etc/.detoxrc.js -c myconf');

    expect(detox.resolveConfig).toHaveBeenCalledWith({
      argv: expect.objectContaining({
        'C': '/etc/.detoxrc.js',
        'c': 'myconf',
      }),
    });
  });

  it('warns if no start commands were found', async () => {
    await callCli('./start', 'start');
    expect(detox.log.warn).toHaveBeenCalledWith(expect.stringContaining('No "start" commands were found'));
  });

  it('spawns the start script from the composed apps config', async () => {
    cmd = buildMockCommand();
    detox.config.commands = [{ appName: 'default', start: `${cmd.cmd} --arg1=value1 --arg2 value2` }];
    await callCli('./start', 'start').catch(() => {});

    expect(cmd.calls).toEqual([
      expect.objectContaining({ argv: [
        expect.stringContaining('executable'),
        '--arg1=value1',
        '--arg2',
        'value2',
      ] }),
    ]);
  });

  it('forwards passthrough arguments to the start script', async () => {
    cmd = buildMockCommand();
    detox.config.commands = [{ appName: 'default', start: `${cmd.cmd} --arg1` }];
    await callCli('./start', 'start -- --arg2').catch(() => {});

    expect(cmd.calls).toEqual([
      expect.objectContaining({ argv: [
          expect.stringContaining('executable'),
          '--arg1',
          '--arg2',
        ] }),
    ]);
  });

  it('stops if one of the scripts is failing', async () => {
    cmd = buildMockCommand({ exitCode: 0, sleep: 100 });
    detox.config.commands.push({ appName: 'app1', start: 'node --eval="process.exit(3)"' });
    detox.config.commands.push({ appName: 'app2', start: cmd.cmd });
    await expect(callCli('./start', 'start')).rejects.toThrowError(/Command exited with code 3/);

    expect(cmd.calls).toHaveLength(0);
  });

  it.each([
    ['-f'],
    ['--force'],
  ])('does not stop in %s mode if one of the scripts is failing', async (__force) => {
    cmd = buildMockCommand({ sleep: 100 });
    detox.config.commands.push({ appName: 'app1', start: 'node --eval="process.exit(3)"' });
    detox.config.commands.push({ appName: 'app2', start: cmd.cmd });

    await callCli('./start', `start ${__force}`);
    expect(cmd.calls).toHaveLength(1);
  });
});
