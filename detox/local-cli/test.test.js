jest.mock('../src/utils/logger');
const {normalize} = require('path');
const shellQuote = require('./utils/shellQuote');

describe('test', () => {
  let mockExec;
  let argv;
  let logger;

  beforeAll(() => {
    argv = process.argv;
  });

  beforeEach(() => {
    process.argv = ['node', 'jest', 'test'];

    logger = require('../src/utils/logger');
    mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));
  });

  afterEach(() => {
    process.argv = argv;
  });

  describe('mocha', () => {
    it('runs successfully', async () => {
      mockPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      });

      await callCli('./test', 'test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(`${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --configuration only --grep :ios: --invert --artifacts-location "${normalize('artifacts/only.')}`),
        expect.anything()
      );

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringMatching(/ "e2e"$/),
        expect.anything()
      );
    });

    it('should warn about deprecated options', async () => {
      mockPackageJson({
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      });

      await callCli('./test', 'test --specs e2e');
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('migration guide'));
    });
  });

  describe('jest', () => {
    it('runs successfully', async () => {
      mockPackageJson({
        testRunner: 'jest',
        configurations: {
          only: {
            type: 'android.emulator'
          }
        }
      });

      const mockExec = jest.fn();
      jest.mock('child_process', () => ({
        execSync: mockExec
      }));

      await callCli('./test', 'test');

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `${normalize('node_modules/.bin/jest')} --config=e2e/config.json --maxWorkers=1 ${shellQuote('--testNamePattern=^((?!:ios:).)*$')} "e2e"`
        ),
        expect.objectContaining({
          env: expect.objectContaining({
            configuration: 'only',
            recordLogs: 'none',
            takeScreenshots: 'none',
            recordVideos: 'none',
            artifactsLocation: expect.stringContaining(normalize('artifacts/only.')),
          }),
        })
      );
    });
  });

  it('fails with a different runner', async () => {
    mockPackageJson({
      testRunner: 'ava',
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    await expect(callCli('./test', 'test')).rejects.toThrowErrorMatchingSnapshot();
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('overrides workers count to 1 if running Android tests on Jest', async () => {
    mockPackageJson({
      'test-runner': 'jest',
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    await callCli('./test', 'test --workers 2');
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining(` --maxWorkers=1 `),
      expect.anything()
    );
  });

  it('sets default value for debugSynchronization', async () => {
    mockPackageJson({
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    try {
      await callCli('./test', 'test --debug-synchronization');
    } catch (e) {
      console.log(e);
    }
    expect(mockExec).toHaveBeenCalledWith(
      expect.stringContaining(
        `${normalize('node_modules/.bin/mocha')} --opts e2e/mocha.opts --configuration only --debug-synchronization 3000 --grep :ios: --invert --artifacts-location "${normalize('artifacts/only.')}`
      ),
      expect.anything()
    );
  });

  it('passes extra args to the test runner', async () => {
    mockPackageJson({
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    try {
      process.argv = [...process.argv, '--unknown-property', '42', '--flag'];
      await callCli('./test', 'test --unknown-property 42 --flag');
    } catch (e) {
      console.log(e);
    }

    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('--unknown-property 42 --flag'), expect.anything());
  });
});
