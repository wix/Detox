jest.mock('../src/utils/logger');

describe('build', () => {
  let mockExec;
  beforeEach(() => {
    mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));
  });

  it('runs the build script if there is only one config', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "only"'
        }
      }
    });

    await callCli('./build', 'build');
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('only'), expect.anything());
  });

  it('runs the build script of selected config', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "only"'
        },
        myconf: {
          build: 'echo "myconf"'
        }
      }
    });

    await callCli('./build', 'build -c myconf');
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('myconf'), expect.anything());
  });

  it('fails with multiple configs if none is selected', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "only"'
        },
        myconf: {
          build: 'echo "myconf"'
        }
      }
    });

    await expect(callCli('./build', 'build')).rejects.toThrowErrorMatchingSnapshot();
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without configurations', async () => {
    mockPackageJson({});

    await expect(callCli('./build', 'build')).rejects.toThrowErrorMatchingSnapshot();
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without build script', async () => {
    mockPackageJson({
      configurations: {
        only: {}
      }
    });

    await expect(callCli('./build', 'build -c only')).rejects.toThrowErrorMatchingSnapshot();
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without build script and configuration', async () => {
    mockPackageJson({
      configurations: {
        only: {}
      }
    });

    await expect(callCli('./build', 'build')).rejects.toThrowErrorMatchingSnapshot();
    expect(mockExec).not.toHaveBeenCalled();
  });
});
