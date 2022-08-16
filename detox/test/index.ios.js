import example from './src/app';

import {
  AppRegistry,
} from 'react-native';

class exampleIos extends example {}

console.disableYellowBox = true;
AppRegistry.registerComponent('example', () => exampleIos);
