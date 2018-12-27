const yargs = require('yargs');
const path = require('path');

function call(cmd) {
  const parser = yargs
    .scriptName('detox')
    .command(require('./test'))
    .help();

  return new Promise((resolve, reject) => {
    try {
      parser.parse(cmd, (err, argv, output) => resolve(output));
    } catch (e) {
      reject(e);
    }
  });
}

function mockPackageJson(mockContent) {
  jest.mock(path.join(process.cwd(), 'package.json'), () => ({
    detox: mockContent
  }));
}

describe('test', () => {
  describe('mocha', () => {
    it('runs successfully', async () => {
      mockPackageJson({
        configurations: {
          only: {
            type: 'emulator.android'
          }
        }
      });

      const mockExec = jest.fn();
      jest.mock('child_process', () => ({
        execSync: mockExec
      }));

      try {
        await call('test');
      } catch (e) {
        console.log(e);
      }
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          'node_modules/.bin/mocha e2e --opts e2e/mocha.opts --configuration only  --no-colors    --grep undefined --invert  --record-logs none --take-screenshots none --record-videos none --artifacts-location "artifacts/only.'
        ),
        expect.anything()
      );
    });
  });

  describe('jest', () => {
    it('runs successfully', async () => {
      mockPackageJson({
        testRunner: 'jest',
        configurations: {
          only: {
            type: 'emulator.android'
          }
        }
      });

      const mockExec = jest.fn();
      jest.mock('child_process', () => ({
        execSync: mockExec
      }));

      try {
        await call('test');
      } catch (e) {
        console.log(e);
      }
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          "node_modules/.bin/jest e2e --config=e2e/config.json --no-color --maxWorkers=1 '--testNamePattern=^((?!undefined).)*$'"
        ),
        expect.anything()
      );
    });
  });

  it('fails with a different runner', async () => {
    mockPackageJson({
      testRunner: 'ava',
      configurations: {
        only: {
          type: 'emulator.android'
        }
      }
    });

    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    const mockError = jest.fn();
    try {
      await call('test');
    } catch (e) {
      mockError(e.toString());
    }
    expect(mockExec).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining("ava is not supported in detox cli tools. You can still run your tests with the runner's own cli tool")
    );
  });
});
