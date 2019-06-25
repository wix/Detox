import React, {Component} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { PropTypes } from 'prop-types';

import * as Screens from './Screens';

const isAndroid = Platform.OS === 'android';

class example extends Component {

  constructor(props) {
    super(props);
    this.state = {
      screen: undefined,
      screenProps: {},
      url: undefined,
      notification: undefined
    };
  }

  renderButton(title, onPressCallback) {
    return (
      <TouchableOpacity onPress={() => {
        onPressCallback();
      }}>
        <Text style={{color: 'blue', marginBottom: 10}}>{title}</Text>
      </TouchableOpacity>
    );
  }

  renderScreenButton(title, component) {
    return this.renderButton(title, () => {
      this.setState({screen: component});
    });
  }

  renderText(text) {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {text}
        </Text>
      </View>
    );
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL();
    if (url) {
      console.log('App@didMount: Found pending URL', url);
      this.setState({url: url});
    }
  }

  componentWillMount() {
    Linking.addEventListener('url', (params) => this._handleOpenURL(params));
  }

  render() {
    if (this.state.notification) {
      console.log("App@render: rendering a notification", this.state.notification);
      if (this.state.notification.title) {
        return this.renderText(this.state.notification.title);
      } else {
        return this.renderText(this.state.notification);
      }

    }

    else if (this.state.url) {
      console.log("App@render: rendering a URL:", this.state.url);
      return this.renderText(this.state.url);
    }

    if (!this.state.screen) {
		  console.log("App@render: JS rendering main screen");
      return (
        <View style={{flex: 1, paddingTop: 10, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, marginBottom: 10}}>
            Choose a test
          </Text>
          {this.renderScreenButton('Language', Screens.LanguageScreen)}
          {this.renderScreenButton('Sanity', Screens.SanityScreen)}
          {this.renderScreenButton('Matchers', Screens.MatchersScreen)}
          {this.renderScreenButton('Actions', Screens.ActionsScreen)}
          {this.renderScreenButton('Scroll-Actions', Screens.ScrollActionsScreen)}
          {this.renderScreenButton('Assertions', Screens.AssertionsScreen)}
          {this.renderScreenButton('WaitFor', Screens.WaitForScreen)}
          {this.renderScreenButton('Stress', Screens.StressScreen)}
          {this.renderScreenButton('Switch Root', Screens.SwitchRootScreen)}
          {this.renderScreenButton('Timeouts', Screens.TimeoutsScreen)}
          {this.renderScreenButton('Orientation', Screens.Orientation)}
          {this.renderScreenButton('Permissions', Screens.Permissions)}
          {this.renderScreenButton('Network', Screens.NetworkScreen)}
          {this.renderScreenButton('Animations', Screens.AnimationsScreen)}
          {this.renderScreenButton('Location', Screens.LocationScreen)}
          {this.renderScreenButton('DatePicker', Screens.DatePickerScreen)}
          {this.renderButton('Crash', () => {
            throw new Error('Simulated Crash')
          })}
          {this.renderScreenButton('Shake', Screens.ShakeScreen)}
          {isAndroid && this.renderScreenButton('Launch Args', Screens.LaunchArgsScreen)}
        </View>
      );
    }
    const Screen = this.state.screen;
    return (
      <Screen/>
    );
  }

  _onNotification(notification) {
    console.log('App@onNotification:', notification);
    this.setState({notification: notification.getAlert()});
  }

  _handleOpenURL(params) {
    console.log('App@handleOpenURL:', params);
    this.setState({url: params.url});
  }
}

module.exports = example;
