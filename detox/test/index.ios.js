import { LogBox, AppRegistry } from 'react-native';
import {LaunchArguments} from 'react-native-launch-arguments';

import example from './src/app';

class exampleIos extends example {}

if (LaunchArguments.value().simulateEarlyCrash) {
  throw new Error('Simulating early crash');
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent('example', () => exampleIos);
