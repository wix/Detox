describe('run-server', () => {
  it('starts the server', async () => {
    jest.mock('../src/server/DetoxServer');
    const DetoxServer = require('../src/server/DetoxServer');
    await callCli('./run-server', 'run-server');

    expect(DetoxServer).toHaveBeenCalledWith(expect.objectContaining({ port: 8099 }));
  });

  it('throws if the port number is out of range', async () => {
    jest.spyOn(process, 'exit'); // otherwise tests are aborted
    jest.mock('../src/server/DetoxServer');
    const DetoxServer = require('../src/server/DetoxServer');

    expect(callCli('./run-server', 'run-server -p 100000')).rejects.toEqual(
      new Error('The port should be between 1 and 65535, got 100000')
    );
    expect(DetoxServer).not.toHaveBeenCalled();
  });
});
