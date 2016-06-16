/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity
} from 'react-native';

class example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      afterButton: false
    };
  }
  render() {
    if (this.state.afterButton) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 30}}>
          Welcome
        </Text>
        <TouchableOpacity onPress={this.onButtonPress.bind(this)}>
          <Text style={{color: 'blue'}}>Click Me</Text>
        </TouchableOpacity>
      </View>
    );
  }
  renderAfterButton() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          Yay
        </Text>
      </View>
    );
  }
  onButtonPress() {
    this.setState({
      afterButton: true
    });
  }
}

AppRegistry.registerComponent('example', () => example);
