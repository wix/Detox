import example from './src/app';
import { LogBox } from 'react-native';

import {
  AppRegistry
} from 'react-native';

class exampleIos extends example {
  async componentDidMount() {
    super.componentDidMount();
  }
}

LogBox.ignoreAllLogs();
AppRegistry.registerComponent('example', () => exampleIos);
