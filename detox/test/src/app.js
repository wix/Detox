import React, {Component} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Linking,
  Platform,
  NativeModules,
} from 'react-native';
import * as Screens from './Screens';

const isAndroid = Platform.OS === 'android';
const isIos = Platform.OS === 'ios';

const { NativeModule } = NativeModules;

export default class example extends Component {

  constructor(props) {
    super(props);
    this.state = {
      screen: undefined,
      screenProps: {},
      url: undefined,
      notification: undefined,
    };

    Linking.addEventListener('url', (params) => this._handleOpenURL(params));

    this.setScreen = this.setScreen.bind(this);
  }

  async componentDidMount() {
    const url = await Linking.getInitialURL();
    if (url) {
      console.log('App@didMount: Found pending URL', url);
      this.setState({url: url});
    }
  }

  renderButton(title, onPressCallback) {
    return (
      <TouchableOpacity onPress={() => {
        onPressCallback();
      }}>
        <Text style={{color: 'blue', marginBottom: 8}}>{title}</Text>
      </TouchableOpacity>
    );
  }

  renderScreenNotifyingButton_iOS(title, notificationName) {
    if (notificationName == null) {
      throw new Error('Got no notification name for ' + title);
    }

    return this.renderButton(title, () => {
      NativeModule.sendNotification('ChangeScreen', notificationName);
    });
  }

  renderScreenButton(title, component) {
    if (component == null) {
      throw new Error('Got no component for ' + title);
    }

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

  renderInlineSeparator() {
    return <Text style={{width: 10}}> | </Text>;
  }

  render() {
    if (this.state.url) {
      console.log('App@render: rendering a URL:', this.state.url);
      return this.renderText(this.state.url);
    }

    if (this.state.screen) {
      console.log('App@render: JS rendering screen');
      const Screen = this.state.screen;
      return <Screen setScreen={this.setScreen}/>;
    }

    console.log('App@render: JS rendering main screen');
    return (
      <View style={{flex: 1, paddingTop: 10, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 18, marginBottom: 10}}>
          Choose a test
        </Text>
        {this.renderScreenButton('Language', Screens.LanguageScreen)}
        {this.renderScreenButton('Sanity', Screens.SanityScreen)}
        {this.renderScreenButton('Matchers', Screens.MatchersScreen)}
        {this.renderScreenButton('Actions', Screens.ActionsScreen)}
        {this.renderScreenButton('Visibility Expectation', Screens.VisibilityExpectationScreen)}
        {!isAndroid && this.renderScreenButton('Visibility Debug Artifacts', Screens.VisibilityScreen)}
        {this.renderScreenButton('Integrative Actions', Screens.IntegActionsScreen)}
        {this.renderScreenButton('FS Scroll Actions', Screens.ScrollActionsScreen)}
        {this.renderScreenButton('Assertions', Screens.AssertionsScreen)}
        {this.renderScreenButton('WaitFor', Screens.WaitForScreen)}
        {this.renderScreenButton('Stress', Screens.StressScreen)}
        {this.renderScreenButton('Switch Root', Screens.SwitchRootScreen)}
        {this.renderScreenButton('Timeouts', Screens.TimeoutsScreen)}
        {this.renderScreenButton('Orientation', Screens.Orientation)}
        {this.renderScreenButton('Permissions', Screens.Permissions)}
        {this.renderScreenButton('Network', Screens.NetworkScreen)}
        {this.renderAnimationScreenButtons()}
        {this.renderScreenButton('Device', Screens.DeviceScreen)}
        {this.renderScreenButton('Location', Screens.LocationScreen)}
        {!isAndroid && this.renderScreenButton('DatePicker', Screens.DatePickerScreen)}
        {!isAndroid && this.renderScreenButton('Picker', Screens.PickerViewScreen)}
        {isAndroid && this.renderScreenButton('WebView', Screens.WebViewScreen)}
        {this.renderScreenButton('Attributes', Screens.AttributesScreen)}

        { /* TODO: Push this into a dedicated screen */ }
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          {this.renderButton('Crash', () => {
            // Note: this crashes the native-modules thread (and thus an *uncaught* exception, on Android).
            throw new Error('Simulated Crash');
          })}
          {isAndroid && this.renderInlineSeparator()}
          {isAndroid && this.renderButton('UI Crash', () => {
            // Killing main-thread while handling a tap will evidently cause
            // the tap-action itself to fail and thus for an error to be responded
            NativeModule.crashMainThread();
          })}
          {isAndroid && this.renderInlineSeparator()}
          {isAndroid && this.renderButton('ANR', () => {
            NativeModule.chokeMainThread();
          })}
        </View>

        {isIos && this.renderScreenButton('Shake', Screens.ShakeScreen)}
        {isIos && this.renderScreenNotifyingButton_iOS('Drag And Drop', 'dragAndDrop')}
        {isIos && this.renderScreenNotifyingButton_iOS('Custom Keyboard', 'customKeyboard')}

        {this.renderScreenButton('Element-Screenshots', Screens.ElementScreenshotScreen)}

        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          {isAndroid && this.renderScreenButton('Launch Args', Screens.LaunchArgsScreen)}
          {isAndroid && this.renderInlineSeparator()}
          {isAndroid && this.renderScreenButton('Launch-Notification', Screens.LaunchNotificationScreen)}
        </View>
      </View>
    );
}

  setScreen(name) {
    this.setState({
      screen: Screens[name],
    });
  }

  _onNotification(notification) {
    console.log('App@onNotification:', notification);
    this.setState({notification: notification.getAlert()});
  }

  renderAnimationScreenButtons() {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'center'}}>
        {this.renderScreenButton('RN Animations', Screens.RNAnimationsScreen)}
        {isAndroid && this.renderInlineSeparator()}
        {isAndroid && this.renderScreenButton('Native Animation', Screens.NativeAnimationsScreen)}
      </View>
    );
  }

  _handleOpenURL(params) {
    console.log('App@handleOpenURL:', params);
    this.setState({url: params.url});
  }
}
