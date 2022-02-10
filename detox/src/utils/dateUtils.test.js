describe('Date/time utils', () => {
  let dateUtils;
  beforeEach(() => {
    dateUtils = require('./dateUtils');
  });

  describe('"short" formatter', () => {
    it('should return an HH:MM:SS.l format', () => {
      const moonLanding = new Date('July 20, 69 20:17:59.123');
      expect(dateUtils.shortFormat(moonLanding)).toEqual('20:17:59.123');
    });

    it('should 1-pad all-around', () => {
      const date = new Date('January 1, 2000 1:2:3.004');
      expect(dateUtils.shortFormat(date)).toEqual('01:02:03.004');
    });

    it('should 2- or 3-pad all-around', () => {
      const date = new Date('January 1, 2000 0:0:0');
      expect(dateUtils.shortFormat(date)).toEqual('00:00:00.000');
    });
  });
});
