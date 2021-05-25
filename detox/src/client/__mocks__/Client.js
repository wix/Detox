const Deferred = require('../../utils/Deferred');
const FakeClient = jest.genMockFromModule('../Client');

FakeClient.setInfiniteConnect = () => {
  FakeClient.mockImplementationOnce(() => {
    const client = new FakeClient();
    client.deferred = new Deferred();
    client.connect.mockReturnValue(client.deferred.promise);
    client.cleanup.mockImplementation(() => {
      client.deferred.reject('Fake error: aborted connection');
    });

    return client;
  });
};

module.exports = FakeClient;
