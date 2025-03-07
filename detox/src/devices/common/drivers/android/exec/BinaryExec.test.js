/* eslint-disable node/no-extraneous-require */
describe('BinaryExec', () => {
  const binaryPath = '/binary/mock';

  let exec;
  let spawn;
  let binaryExec;
  beforeEach(() => {
    jest.mock('../../../../../utils/childProcess', () => ({
      execAsync: jest.fn().mockResolvedValue(''),
      spawnAndLog: jest.fn()
    }));
    exec = require('../../../../../utils/childProcess').execAsync;
    spawn = require('../../../../../utils/childProcess').spawnAndLog;

    const { BinaryExec } = require('./BinaryExec');
    binaryExec = new BinaryExec(binaryPath);
  });

  it('should return the binary-path as the toString()', async () => {
    expect(binaryExec.toString()).toEqual(binaryPath);
  });

  describe('exec-command', () => {
    it('exec-command should return args as toString()', () => {
      const { ExecCommand } = require('./BinaryExec');
      class MockExecCommand extends ExecCommand {
        _getArgsString() {
          return 'test args';
        }
      }

      expect(new MockExecCommand().toString()).toEqual('test args');
    });
  });

  describe('exec', () => {
    it('should execute the binary with a real command', async () => {
      const command = anEmptyCommand();

      await binaryExec.exec(command);

      expect(exec).toHaveBeenCalledWith(`"${binaryPath}" `);
    });

    it('should utilize command-args', async () => {
      const command = aCommandMockWithArgsString('-mock -argz');

      await binaryExec.exec(command);

      expect(exec).toHaveBeenCalledWith(`"${binaryPath}" -mock -argz`);
    });

    it('should return content of resolved promise', async () => {
      const execResult = 'mock stdout content';
      exec.mockResolvedValue(execResult);

      const { ExecCommand } = require('./BinaryExec');
      const command = new ExecCommand();
      const result = await binaryExec.exec(command);

      expect(result).toEqual(execResult);
    });
  });

  describe('spawn', () => {
    it('should spawn the binary with a real command', async () => {
      const command = anEmptyCommand();

      await binaryExec.spawn(command);

      expect(spawn).toHaveBeenCalledWith(binaryPath, expect.anything(), expect.anything());
    });

    it('should pass through command-args', async () => {
      const commandArgs = ['-mock', '-args'];
      const command = aCommandMockWithArgs(commandArgs);

      await binaryExec.spawn(command);

      expect(spawn).toHaveBeenCalledWith(binaryPath, commandArgs, expect.anything());
    });

    it('should chain-return spawn result', async () => {
      const spawnResult = Promise.resolve('mock result');
      spawn.mockReturnValue(spawnResult);

      const command = anEmptyCommand();

      const result = binaryExec.spawn(command);
      expect(result).toEqual(spawnResult);
    });
  });
});

const anEmptyCommand = () => {
  const { ExecCommand } = require('./BinaryExec');
  return new ExecCommand();
};

const aCommandMockWithArgsString = (argsString) => {
  const { ExecCommand } = jest.genMockFromModule('./BinaryExec');
  const command = new ExecCommand();
  command._getArgsString.mockReturnValue(argsString);
  return command;
};

const aCommandMockWithArgs = (commandArgs) => {
  const { ExecCommand } = jest.genMockFromModule('./BinaryExec');
  const command = new ExecCommand();
  command._getArgs.mockReturnValue(commandArgs);
  return command;
};
