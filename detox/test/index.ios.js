import example from './src/app';

import {
  AppRegistry
} from 'react-native';

class exampleIos extends example {
  async componentDidMount() {
    super.componentDidMount();
  }
}

console.disableYellowBox = true;
AppRegistry.registerComponent('example', () => exampleIos);