describe('clean-framework-cache', () => {
  it('shows help text', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(await callCli('./clean-framework-cache', '--help')).toMatchInlineSnapshot(`
"detox [command]

Commands:
  detox clean-framework-cache  Delete all compiled framework binaries from
                               ~/Library/Detox, they will be rebuilt on 'npm
                               install' or when running 'build-framework-cache'

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]"
`);
  });

  it('removes folder on osx', async () => {
    jest.mock('os', () => ({
      platform: jest.fn().mockReturnValue('darwin'),
      homedir: jest.fn().mockReturnValue('/home')
    }));

    jest.mock('fs-extra', () => ({
      remove: jest.fn()
    }));
    const fs = require('fs-extra');
    await callCli('./clean-framework-cache', 'clean-framework-cache');

    expect(fs.remove).toHaveBeenCalledWith('/home/Library/Detox');
  });

  it('does nothing on other platforms', async () => {
    jest.mock('os', () => ({
      platform: jest.fn().mockReturnValue('windows'),
      homedir: jest.fn().mockReturnValue('/home')
    }));

    jest.mock('fs-extra', () => ({
      remove: jest.fn()
    }));
    const fs = require('fs-extra');
    await callCli('./clean-framework-cache', 'clean-framework-cache');

    expect(fs.remove).not.toHaveBeenCalled();
  });
});
