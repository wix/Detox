
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('StatusBar Override', () => {
  it('Time', async () => {
    await device.setStatusBar({
      time: '11:11',
    });
    await sleep(500);
    await device.setStatusBar({
      time: '22:22',
    });
    await sleep(500);
    await device.setStatusBar({
      time: '33:33',
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('dataNetwork', async () => {
    await device.setStatusBar({
      dataNetwork: '3g',
    });
    await sleep(500);
    await device.setStatusBar({
      dataNetwork: '4g',
    });
    await sleep(500);
    await device.setStatusBar({
      dataNetwork: 'lte',
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('wifiMode', async () => {
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiMode: 'failed',
    });
    await sleep(1000);
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiMode: 'searching',
    });
    await sleep(1000);
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiMode: 'active',
    });
    await sleep(1000);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('wifiBars', async () => {
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiBars: '0',
    });
    await sleep(500);
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiBars: '1',
    });
    await sleep(500);
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiBars: '2',
    });
    await sleep(500);
    await device.setStatusBar({
      dataNetwork: 'wifi',
      wifiBars: '3',
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('cellularMode', async () => {
    await device.setStatusBar({
      cellularMode: 'notSupported',
    });
    await sleep(1000);
    await device.setStatusBar({
      cellularMode: 'searching',
    });
    await sleep(1000);
    await device.setStatusBar({
      cellularMode: 'failed',
    });
    await sleep(1000);
    await device.setStatusBar({
      cellularMode: 'active',
    });
    await sleep(1000);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('cellularBars', async () => {
    await device.setStatusBar({
      wifiMode: 'failed',
      dataNetwork: '3g',
    });
    await device.setStatusBar({
      cellularBars: '0',
    });
    await sleep(500);
    await device.setStatusBar({
      cellularBars: '1',
    });
    await sleep(500);
    await device.setStatusBar({
      cellularBars: '2',
    });
    await sleep(500);
    await device.setStatusBar({
      cellularBars: '3',
    });
    await sleep(500);
    await device.setStatusBar({
      cellularBars: '4',
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('batteryState', async () => {
    await device.setStatusBar({
      batteryState: 'charging'
    });
    await sleep(500);
    await device.setStatusBar({
      batteryState: 'discharging'
    });
    await sleep(500);
    await device.setStatusBar({
      batteryState: 'charged'
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

  it('batteryLevel', async () => {
    await device.setStatusBar({
      batteryLevel: '30'
    });
    await sleep(500);
    await device.setStatusBar({
      batteryLevel: '60'
    });
    await sleep(500);
    await device.setStatusBar({
      batteryLevel: '90'
    });
    await sleep(500);
    await device.resetStatusBar();
    await sleep(500);
  });

});
