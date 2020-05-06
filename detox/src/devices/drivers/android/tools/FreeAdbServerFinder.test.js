describe('FreeAdbServerFinder', () => {

  const basePort = 1000;

  let registry;
  let FreeAdbServerFinder;
  let freeAdbServerFinder;
  beforeEach(() => {
    registry = {
      readAll: jest.fn(),
    };

    jest.mock('../../../../utils/logger', () => ({
      child: jest.fn().mockReturnValue({
        debug: jest.fn(),
      }),
    }));

    FreeAdbServerFinder = require('./FreeAdbServerFinder');
    freeAdbServerFinder = new FreeAdbServerFinder(registry, basePort);
  });

  it('should resolve the first port if all are free', () => {
    registry.readAll.mockReturnValue([]);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(1000);
  });

  it('should use a default for base port', () => {
    registry.readAll.mockReturnValue([]);

    const freeAdbServerFinder = new FreeAdbServerFinder(registry, undefined);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(20000);
  });

  it('should find the next available port', () => {
    registry.readAll.mockReturnValue([1000]);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(1002);
  });

  it('should resolve the first available port if unused', () => {
    registry.readAll.mockReturnValue([1002]);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(1000);
  });

  it('should resolve the 2nd unused port', () => {
    registry.readAll.mockReturnValue([1004, 1000]);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(1002);
  });

  it('should resolve a null if all ports are used', () => {
    const allPorts = Array.from({ length: 100 }, (_, i) => 1000 + i * 2);
    registry.readAll.mockReturnValue(allPorts);
    expect(freeAdbServerFinder.findFreeAdbServer()).toEqual(null);
  });
});
