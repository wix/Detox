import {
  AppRegistry,
} from 'react-native';

import example from './src/app';

import registerEarlyCrashIfNeeded from './registerEarlyCrashIfNeeded';

class exampleAndroid extends example {
  async componentDidMount() {
    await super.componentDidMount();
    registerEarlyCrashIfNeeded();
  }
}

AppRegistry.registerComponent('example', () => exampleAndroid);
