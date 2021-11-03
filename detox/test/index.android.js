import example from './src/app';
// import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue'
// MessageQueue.spy(true);

import {
  AppRegistry,
} from 'react-native';

class exampleAndroid extends example {

}

console.disableYellowBox = true;
AppRegistry.registerComponent('example', () => exampleAndroid);
