jest.mock('../src/utils/logger');

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

    await expect(callCli('./run-server', 'run-server -p PORT')).rejects.toThrowErrorMatchingSnapshot();
    await expect(callCli('./run-server', 'run-server -p 0')).rejects.toThrowErrorMatchingSnapshot();
    await expect(callCli('./run-server', 'run-server -p 100000')).rejects.toThrowErrorMatchingSnapshot();
    expect(DetoxServer).not.toHaveBeenCalled();
  });
});
