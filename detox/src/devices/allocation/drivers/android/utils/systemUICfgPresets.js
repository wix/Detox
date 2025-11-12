/**
 * @type Detox.DetoxSystemUIConfig
 */
const minimalConfigPreset = {
  keyboard: 'hide',
  touches: 'show',
  navigationMode: '3-button',
  statusBar: {
    notifications: 'hide',
    wifiSignal: 'strong',
    cellSignal: 'none',
    batteryLevel: 'full',
    charging: false,
    clock: '1337',
  },
};

/**
 * @type Detox.DetoxSystemUIConfig
 */
 const genyConfigPreset = {
  keyboard: 'hide',
  statusBar: {
    notifications: 'hide',
    wifiSignal: 'strong',
    cellSignal: 'none',
    batteryLevel: 'full',
    charging: true,
  },
};

module.exports = {
  minimal: minimalConfigPreset,
  genymotion: genyConfigPreset,
};
