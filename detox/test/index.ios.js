import React, {Component} from 'react';
import {
  AppRegistry,
  Text,
  View,
  TouchableOpacity,
  PushNotificationIOS
} from 'react-native';
import * as Screens from './src/Screens';

class example extends Component {

  constructor(props) {
    super(props);
    this.state = {
      screen: undefined,
      pushNotification: undefined
    };
  }

  renderScreenButton(title, component) {
    return (
      <TouchableOpacity onPress={() => {
        this.setState({screen: component});
      }}>
        <Text style={{color: 'blue', marginBottom: 20}}>{title}</Text>
      </TouchableOpacity>
    )
  }

  renderAfterPushNotification(text) {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {text}
        </Text>
      </View>
    );
  }

  async componentDidMount() {
    const result = await PushNotificationIOS.getInitialNotification();
    if (result) {
      this.setState({pushNotification: result.getAlert()});
    }
  }

  render() {
    if (this.state.pushNotification) {
      console.log(`this.state.pushNotification ${this.state.pushNotification}`);
      return this.renderAfterPushNotification( this.state.pushNotification.title);
    }

    if (!this.state.screen) {
      return (
        <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, marginBottom: 30}}>
            Choose a test
          </Text>
          {this.renderScreenButton('Sanity', Screens.SanityScreen)}
          {this.renderScreenButton('Matchers', Screens.MatchersScreen)}
          {this.renderScreenButton('Actions', Screens.ActionsScreen)}
          {this.renderScreenButton('Assertions', Screens.AssertionsScreen)}
          {this.renderScreenButton('WaitFor', Screens.WaitForScreen)}
          {this.renderScreenButton('Stress', Screens.StressScreen)}
          {this.renderScreenButton('Switch Root', Screens.SwitchRootScreen)}
          {this.renderScreenButton('Timeouts', Screens.TimeoutsScreen)}
        </View>
      );
    }
    const Screen = this.state.screen;
    return (
      <Screen />
    );
  }

}

AppRegistry.registerComponent('example', () => example);

PushNotificationIOS.addEventListener('notification', () => console.log('received notification!!!'));
PushNotificationIOS.addEventListener('localNotification',  () => console.log('received localNotification!!!'));
