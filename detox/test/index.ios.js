import example from './src/app';

import {
  AppRegistry,
  PushNotificationIOS
} from 'react-native';

class exampleIos extends example {

  async componentDidMount() {
    super.componentDidMount();
  }
}

AppRegistry.registerComponent('example', () => exampleIos);