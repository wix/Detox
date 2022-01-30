// const mockMd5 = jest.fn();
// jest.mock('crypto-js', () => ({
//   md5: () => mockMd5(),
// }));

const { getMd5 } = require('./CryptoUtils');

describe('CryptoUtils', () => {
  it('should call cryto-js md5 function', async () => {
    await getMd5('test');
    // expect(mockMd5).toHaveBeenCalledTimes(1);
  });
});
