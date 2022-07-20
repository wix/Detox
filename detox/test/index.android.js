import {LaunchArguments} from 'react-native-launch-arguments';
import example from './src/app';
// import MessageQueue from 'react-native/Libraries/BatchedBridge/MessageQueue'
// MessageQueue.spy(true);

import {
  AppRegistry,
} from 'react-native';

class exampleAndroid extends example {

}

if (LaunchArguments.value().simulateEarlyCrash) {
  throw new Error('Simulating early crash');
}

AppRegistry.registerComponent('example', () => exampleAndroid);
