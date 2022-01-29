const mockMd5 = jest.fn();
jest.mock('crypto-js', () => ({
  md5: () => mockMd5(),
}))

describe('CryptoUtils', () => {
  let uut;

  beforeEach(() => {
    const CryptoUtils = require('./CryptoUtils');
    uut = new CryptoUtils();
  })

  it('should call cryto-js md5 function', async () => {
    await uut.getMd5('test');
    expect(mockMd5).toHaveBeenCalledTimes(1);
  });
});
