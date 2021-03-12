import example from './src/app';

import {
  AppRegistry,
  PushNotificationIOS
} from 'react-native';

class exampleIos extends example {

  componentWillMount() {
    super.componentWillMount();
    PushNotificationIOS.addEventListener('notification', (notification) => this._onNotification(notification));
    PushNotificationIOS.addEventListener('localNotification', (notification) => this._onNotification(notification));
  }

  async componentDidMount() {
    super.componentDidMount();
    const notification = await PushNotificationIOS.getInitialNotification();
    if (notification) {
      this.setState({notification: notification.getAlert().title});
    }
  }
}

AppRegistry.registerComponent('example', () => exampleIos);