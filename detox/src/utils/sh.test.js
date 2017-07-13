describe('sh', () => {
  let sh;
  let cpp;

  beforeEach(() => {
    jest.mock('child-process-promise');
    cpp = require('child-process-promise');
    sh = require('./sh');
  });

  it(``, async () => {
    await sh.cp('path/to/src pat/to/dest');
    expect(cpp.exec).toHaveBeenCalledWith('cp path/to/src pat/to/dest');
  });

  it(``, async () => {
    await sh.cp('-r', 'path/to/src pat/to/dest');
    expect(cpp.exec).toHaveBeenCalledWith('cp -r path/to/src pat/to/dest');
  });


  it(``, async () => {
    const npm = require('./sh').npm;
    await npm('-v');
    expect(cpp.exec).toHaveBeenCalledWith('npm -v');
  });
});
