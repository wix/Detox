describe('CryptoUtils', () => {
  let mockMd5;
  let uut;

  beforeEach(() => {
    jest.mock('crypto-js/md5', () => jest.fn());
    mockMd5 = require('crypto-js/md5');
    uut = require('./CryptoUtils');
  });

  it('should call cryto-js md5 function', async () => {
    await uut.getMd5('test');
    expect(mockMd5).toHaveBeenCalledTimes(1);
  });
});
