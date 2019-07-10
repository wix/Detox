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
  let uiAutomaton;
  let uiDevice;
  let invoke;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock('./UIAutomator');
    jest.mock('./UIDevice');
    jest.mock('../../invoke');
    uiAutomaton = require('./UIAutomator');
    uiDevice = require('./UIDevice');
    invoke = require('../../invoke');
    UiDeviceProxy = require('./UiDeviceProxy');
    uut = new UiDeviceProxy(invocationManager);
  });

  it('should call UIDevice.pressBack(UIAutomator.instance) for UiDeviceProxy.getUIDevice.pressBack()', async () => {
    uiAutomaton.uiDevice.mockReturnValue(someInstance);
    await uut.getUIDevice().pressBack();

    expect(uiDevice.pressBack).toHaveBeenCalled();
    expect(uiAutomaton.uiDevice).toHaveBeenCalled();
    expect(invoke.callDirectly).toHaveBeenCalledWith(someInstance);
  });
  it('should return invokeResult for call UiDeviceProxy.getUIDevice.getDisplayHeight()', async () => {
    uiAutomaton.uiDevice.mockReturnValue(someInstance);
    invoke.callDirectly.mockReturnValue(someCall);
    const displayHeight = await uut.getUIDevice().getDisplayHeight();

    expect(uiDevice.getDisplayHeight).toHaveBeenCalledWith(someCall);
    expect(uiAutomaton.uiDevice).toHaveBeenCalled();
    expect(invoke.callDirectly).toHaveBeenCalledWith(someInstance);
    expect(displayHeight).toBe(someDisplayHeight);
  });
  it('should call UIDevice.click(UIAutomator.instance, x, y) + invocationManager.execute(call) for UiDeviceProxy.getUIDevice.click(x, y)', async () => {
    const x = 10;
    const y = 10;
    uiAutomaton.uiDevice.mockReturnValue(someInstance);
    invoke.callDirectly.mockReturnValue(someCall);
    await uut.getUIDevice().click(x, y);

    expect(invoke.callDirectly).toHaveBeenCalledWith(someInstance);
    expect(uiAutomaton.uiDevice).toHaveBeenCalled();
    expect(uiDevice.click).toHaveBeenCalledWith(someCall, x, y);
  });
});
