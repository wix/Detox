import {LaunchArguments} from 'react-native-launch-arguments';
import example from './src/app';

import {
  AppRegistry,
} from 'react-native';

class exampleIos extends example {}

if (LaunchArguments.value().simulateEarlyCrash) { // TODO integrate this into iOS' NativeModule and lose react-native-launch-arguments
  throw new Error('Simulating early crash');
}

console.disableYellowBox = true;
AppRegistry.registerComponent('example', () => exampleIos);
