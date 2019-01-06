describe('build-framework-cache', () => {
  it('shows help text', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(await callCli('./build-framework-cache', '--help')).toMatchInlineSnapshot(`
"detox [command]

Commands:
  detox build-framework-cache  Build Detox.framework to ~/Library/Detox. The
                               framework cache is specific for each combination
                               of Xcode and Detox versions

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]"
`);
  });

  it('executes shell script', async () => {
    jest.mock('child_process');
    const cp = require('child_process');
    await callCli('./build-framework-cache', 'build-framework-cache');

    expect(cp.execSync).toHaveBeenCalledWith(expect.stringContaining('scripts/build_framework.ios.sh'), expect.any(Object));
  });
});
