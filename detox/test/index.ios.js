import {LaunchArguments} from 'react-native-launch-arguments';
import example from './src/app';
import { LogBox } from 'react-native';

import {
  AppRegistry,
} from 'react-native';

class exampleIos extends example {}

if (LaunchArguments.value().simulateEarlyCrash) { // TODO integrate this into iOS' NativeModule and lose react-native-launch-arguments
  throw new Error('Simulating early crash');
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent('example', () => exampleIos);
