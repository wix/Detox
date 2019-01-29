describe('test', () => {
  let mockExec;
  beforeEach(() => {
    mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));
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

      try {
        await callCli('./test', 'test');
      } catch (e) {
        console.log(e);
      }
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          'node_modules/.bin/mocha e2e --opts e2e/mocha.opts --configuration only  --no-colors    --grep :ios: --invert  --record-logs none --take-screenshots none --record-videos none --artifacts-location "artifacts/only.'
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
            type: 'android.emulator'
          }
        }
      });

      const mockExec = jest.fn();
      jest.mock('child_process', () => ({
        execSync: mockExec
      }));

      try {
        await callCli('./test', 'test');
      } catch (e) {
        console.log(e);
      }

      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining(
          `node_modules/.bin/jest \"e2e\" --config=e2e/config.json --no-color --maxWorkers=1 \'--testNamePattern=^((?!:ios:).)*$\'`
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
          type: 'android.emulator'
        }
      }
    });

    const mockError = jest.fn();
    try {
      await callCli('./test', 'test');
    } catch (e) {
      mockError(e.toString());
    }
    expect(mockExec).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining("ava is not supported in detox cli tools. You can still run your tests with the runner's own cli tool")
    );
  });

  it('throws an error if the platform is android and the workers are enabled', async () => {
    mockPackageJson({
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    const mockError = jest.fn();
    try {
      await callCli('./test', 'test --workers 2');
    } catch (e) {
      mockError(e.toString());
    }
    expect(mockExec).not.toHaveBeenCalled();
    expect(mockError).toHaveBeenCalledWith(
      expect.stringContaining('Can not use -w, --workers. Parallel test execution is only supported on iOS currently')
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
        'node_modules/.bin/mocha e2e --opts e2e/mocha.opts --configuration only  --no-colors   --debug-synchronization 3000 --grep :ios: --invert  --record-logs none --take-screenshots none --record-videos none --artifacts-location "artifacts/only.'
      ),
      expect.anything()
    );
  });

  it('passes extra agrs to the test runner', async () => {
    mockPackageJson({
      configurations: {
        only: {
          type: 'android.emulator'
        }
      }
    });

    try {
      await callCli('./test', 'test --unknown-property 42');
    } catch (e) {
      console.log(e);
    }
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('--unknownProperty 42'), expect.anything());
  });
});
