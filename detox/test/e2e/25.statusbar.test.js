

describe('StatusBar Override', () => {
  afterEach(async () => {
    await device.resetStatusBar();
  });
  it.each(['11:11', '22:22', '33:33'])(`setStatusBar({ time: "%s" })`, async (time) => {
    await device.setStatusBar({ time });
    await device.takeScreenshot(`setStatusBar({ time: "${time}" })`);
  })

  it.each(['wifi', '3g', '4g', 'lte', 'lte-a', 'lte+'])(`setStatusBar({ dataNetwork: "%s" })`, async (dataNetwork) => {
    await device.setStatusBar({ dataNetwork });
    await device.takeScreenshot(`setStatusBar({ dataNetwork: "${dataNetwork}" })`);
  })

  it.each(['searching', 'failed', 'active'])(`setStatusBar({ wifiMode: "%s" })`, async (wifiMode) => {
    await device.setStatusBar({ wifiMode, dataNetwork: 'wifi' });
    await device.takeScreenshot(`setStatusBar({ wifiMode: "${wifiMode}" })`);
  })

  it.each(['0', '1', '2', '3'])(`setStatusBar({ wifiBars: "%s" })`, async (wifiBars) => {
    await device.setStatusBar({ wifiBars, dataNetwork: 'wifi' });
    await device.takeScreenshot(`setStatusBar({ wifiBars: "${wifiBars}" })`);
  })

  it.each(['searching', 'failed', 'active'])(`setStatusBar({ cellularMode: "%s" })`, async (cellularMode) => {
    await device.setStatusBar({ cellularMode, dataNetwork: '3g' });
    await device.takeScreenshot(`setStatusBar({ cellularMode: "${cellularMode}" })`);
  })

  it.each(['0', '1', '2', '3', '4'])(`setStatusBar({ cellularBars: "%s" })`, async (cellularBars) => {
    await device.setStatusBar({ cellularBars, dataNetwork: '3g' });
    await device.takeScreenshot(`setStatusBar({ cellularBars: "${cellularBars}" })`);
  })

  it.each(['charging', 'discharging', 'charged'])(`setStatusBar({ batteryState: "%s" })`, async (batteryState) => {
    await device.setStatusBar({ batteryState });
    await device.takeScreenshot(`setStatusBar({ batteryState: "${batteryState}" })`);
  })

  it.each(['30', '60', '90', '100'])(`setStatusBar({ batteryLevel: "%s" })`, async (batteryLevel) => {
    await device.setStatusBar({ batteryLevel });
    await device.takeScreenshot(`setStatusBar({ batteryLevel: "${batteryLevel}" })`);
  })

});
