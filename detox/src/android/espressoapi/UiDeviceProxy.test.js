const someCall = 'some_call';
const someInstance = 'some_instance';
const someDisplayHeight = 1920;
const invocationManager = {
  execute() {
    return {params: {result: someDisplayHeight}};
  }
};
describe('ui device proxy', () => {
  let uut;
  let UiDeviceProxy;
  let uiAutomation;
  let uiDevice;
  let invoke;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('./UIAutomator');
    jest.mock('./UIDevice');
    jest.mock('../../invoke');
    uiAutomation = require('./UIAutomator');
    uiDevice = require('./UIDevice');
    invoke = require('../../invoke');
    UiDeviceProxy = require('./UiDeviceProxy');
    uut = new UiDeviceProxy(invocationManager);
  });

  it('should delegate pressBack to UiDevice', async () => {
    uiAutomation.uiDevice.mockReturnValue(someInstance);
    await uut.getUIDevice().pressBack();

    expect(uiAutomation.uiDevice).toHaveBeenCalled();
    expect(invoke.callDirectly).toHaveBeenCalledWith(someInstance);
    expect(uiDevice.pressBack).toHaveBeenCalled();
  });

  it('should return invokeResult from UiDevice getDisplayHeight', async () => {
    uiAutomation.uiDevice.mockReturnValue(someInstance);
    invoke.callDirectly.mockReturnValue(someCall);
    const displayHeight = await uut.getUIDevice().getDisplayHeight();

    expect(uiDevice.getDisplayHeight).toHaveBeenCalledWith(someCall);
    expect(displayHeight).toEqual(someDisplayHeight);
  });

  it('should pass click params to UiDevice when calling click', async () => {
    const x = 10;
    const y = 10;
    uiAutomation.uiDevice.mockReturnValue(someInstance);
    invoke.callDirectly.mockReturnValue(someCall);
    await uut.getUIDevice().click(x, y);

    expect(uiDevice.click).toHaveBeenCalledWith(someCall, x, y);
  });
});
