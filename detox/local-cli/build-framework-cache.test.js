const yargs = require('yargs');

function call(cmd) {
  const parser = yargs
    .scriptName('detox')
    .command(require('./build-framework-cache'))
    .help();
  return new Promise(resolve => parser.parse(cmd, (_err, _argv, output) => resolve(output)));
}

describe('build-framework-cache', () => {
  it('shows help text', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(await call('--help')).toMatchInlineSnapshot(`
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
    await call('build-framework-cache');

    expect(cp.execSync).toHaveBeenCalledWith(expect.stringContaining('scripts/build_framework.ios.sh'), expect.any(Object));
  });
});
