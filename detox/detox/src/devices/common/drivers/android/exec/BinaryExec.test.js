describe('BinaryExec', () => {
  const binaryPath = '/binary/mock';

  let exec;
  let spawn;
  let binaryExec;
  beforeEach(() => {
    jest.mock('../../../../../utils/childProcess', () => ({
      execWithRetriesAndLogs: jest.fn().mockResolvedValue({
        stdout: '',
      }),
    }));
    exec = require('../../../../../utils/childProcess').execWithRetriesAndLogs;

    jest.mock('child-process-promise', () => ({
      spawn: jest.fn()
    }));
    spawn = require('child-process-promise').spawn;

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

    it('should return content of resolved promise\'s stdout', async () => {
      const execResult = {
        stdout: 'mock stdout content'
      };
      exec.mockResolvedValue(execResult);

      const { ExecCommand } = require('./BinaryExec');
      const command = new ExecCommand();
      const result = await binaryExec.exec(command);

      expect(result).toEqual(execResult.stdout);
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

    it('should chain-return child-process-promise from spawn', async () => {
      const childProcessPromise = Promise.resolve('mock result');
      spawn.mockReturnValue(childProcessPromise);

      const command = anEmptyCommand();

      const result = binaryExec.spawn(command);
      expect(result).toEqual(childProcessPromise);
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
