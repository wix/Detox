var websocket = require('./websocket');
var Invoke = require('./invoke/Invoke');

module.exports = {
  EarlGrey: require('./invoke/EarlGrey'),
  IOS: require('./invoke/IOS'),
  call: Invoke.call,
  execute: websocket.execute
}
