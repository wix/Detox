describe('sh', () => {
  let sh;
  let cpp;

  beforeEach(() => {
    jest.mock('child-process-promise');
    cpp = require('child-process-promise');
    sh = require('./sh');
  });

  it(`Call an undefined function with one string param should generate a full command string`, async () => {
    await sh.cp('path/to/src pat/to/dest');
    expect(cpp.exec).toHaveBeenCalledWith('cp path/to/src pat/to/dest');
  });

  it(`Call an undefined function with two string params should generate a full command string`, async () => {
    await sh.cp('-r', 'path/to/src pat/to/dest');
    expect(cpp.exec).toHaveBeenCalledWith('cp -r path/to/src pat/to/dest');
  });


  it(`Require an undefined param from sh and then initiate it as function should generate a full command string`, async () => {
    const npm = require('./sh').npm;
    await npm('-v');
    expect(cpp.exec).toHaveBeenCalledWith('npm -v');
  });
});
