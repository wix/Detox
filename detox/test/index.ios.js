import {LaunchArguments} from 'react-native-launch-arguments';
import example from './src/app';

import {
  AppRegistry
} from 'react-native';

class exampleIos extends example {
  async componentDidMount() {
    super.componentDidMount();
  }
}

if (LaunchArguments.value().simulateEarlyCrash) {
  throw new Error('Simulating early crash');
}

console.disableYellowBox = true;
AppRegistry.registerComponent('example', () => exampleIos);
