describe('build', () => {
  it('shows help text', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(await callCli('./build', '--help')).toMatchInlineSnapshot(`
"detox [command]

Commands:
  detox build  [convenience method] Run the command defined in
               'configuration.build'

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]"
`);
  });

  it('runs the build script if there is only one config', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "I was build"'
        }
      }
    });
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    await callCli('./build', 'build');
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('I was build'), expect.anything());
  });

  it('runs the build script of selected config', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "I was build"'
        },
        myconf: {
          build: 'echo "Something else"'
        }
      }
    });
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    await callCli('./build', 'build -c myconf');
    expect(mockExec).toHaveBeenCalledWith(expect.stringContaining('Something else'), expect.anything());
  });

  it('fails with multiple configs if none is selected', async () => {
    mockPackageJson({
      configurations: {
        only: {
          build: 'echo "I was build"'
        },
        myconf: {
          build: 'echo "Something else"'
        }
      }
    });
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    expect(callCli('./build', 'build')).rejects.toBeInstanceOf(Error);
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without configurations', async () => {
    mockPackageJson({});
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    expect(callCli('./build', 'build')).rejects.toEqual(new Error('Cannot find detox.configurations in package.json'));
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without build script', async () => {
    mockPackageJson({
      configurations: {
        only: {}
      }
    });
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    expect(callCli('./build', 'build -c only')).rejects.toEqual(new Error('Could not find build script in detox.configurations["only"].build'));
    expect(mockExec).not.toHaveBeenCalled();
  });

  it('fails without build script and configuration', async () => {
    mockPackageJson({
      configurations: {
        only: {}
      }
    });
    const mockExec = jest.fn();
    jest.mock('child_process', () => ({
      execSync: mockExec
    }));

    expect(callCli('./build', 'build')).rejects.toEqual(new Error('Could not find build script in detox.configurations["only"].build'));
    expect(mockExec).not.toHaveBeenCalled();
  });
});
