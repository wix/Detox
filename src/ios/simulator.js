const websocket = require('../websocket');

function reloadReactNativeApp(onLoad) {
  websocket.waitForNextAction('reactNativeAppLoaded', onLoad);
  websocket.sendAction('reactNativeReload');
}

export {
  reloadReactNativeApp
};
