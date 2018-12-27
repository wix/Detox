const yargs = require('yargs');

function call(cmd) {
  const parser = yargs
    .scriptName('detox')
    .command(require('./run-server'))
    .help();

  return new Promise((resolve, reject) => {
    try {
      parser.parse(cmd, (err, argv, output) => resolve(output));
    } catch (e) {
      reject(e);
    }
  });
}

describe('run-server', () => {
  it('shows help text', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted

    expect(await call('--help')).toMatchInlineSnapshot(`
"detox [command]

Commands:
  detox run-server  Start a standalone Detox server

Options:
  --version  Show version number                                       [boolean]
  --help     Show help                                                 [boolean]"
`);
  });

  it('starts the server', async () => {
    jest.mock('../src/server/DetoxServer');
    const DetoxServer = require('../src/server/DetoxServer');
    await call('run-server');

    expect(DetoxServer).toHaveBeenCalledWith(expect.objectContaining({ port: 8099 }));
  });

  it('throws if the port number is out of range', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted
    jest.mock('../src/server/DetoxServer');
    const DetoxServer = require('../src/server/DetoxServer');

    expect(call('run-server -p 100000')).rejects.toEqual(new Error('The port should be between 1 and 65535, got 100000'));
    expect(DetoxServer).not.toHaveBeenCalled();
  });
});
