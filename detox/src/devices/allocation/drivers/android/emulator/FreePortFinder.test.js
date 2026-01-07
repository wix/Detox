describe('FreePortFinder', () => {
  let finder;
  let isPortTaken;

  beforeEach(() => {
    jest.mock('../../../../../utils/netUtils');
    isPortTaken = require('../../../../../utils/netUtils').isPortTaken;
    isPortTaken.mockResolvedValue(false);

    const FreePortFinder = require('./FreePortFinder');
    finder = new FreePortFinder();
  });

  test('should find a free port', async () => {
    const port = await finder.findFreePort();
    expect(port).toBeGreaterThanOrEqual(10000);
    expect(port).toBeLessThanOrEqual(20000);
    expect(port % 2).toBe(0);
    expect(isPortTaken).toHaveBeenCalled();
  });
});
