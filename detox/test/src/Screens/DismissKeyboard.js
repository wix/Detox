import React, { Component } from 'react';
import {
  Text,
  View,
  TextInput,
  Keyboard
} from 'react-native';

export default class DismissKeyboard extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isKeyboardOpen: false
    };
    this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this._keyboardDidShow);
    this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', this._keyboardDidHide);
  }

  componentWillUnmount() {
    this.keyboardDidShowListener.remove();
    this.keyboardDidHideListener.remove();
  }

  _keyboardDidShow = () => {
    this.setState({
      isKeyboardOpen: true
    });
  };

  _keyboardDidHide = () => {
    this.setState({
      isKeyboardOpen: false
    });
  };

  render() {
    return (
      <View style={{flex: 1, paddingTop: 60, justifyContent: 'flex-start', alignItems: 'center'}}>
        <TextInput testID="testInput" value="Test Input" />
        <Text testID="currentKeyboardVisibility" style={{fontSize: 25, marginTop: 50}}>
          {this.state.isKeyboardOpen ? 'KeyboardOpen' : 'KeyboardClosed'}
        </Text>
      </View>
    );
  }
}
