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
  ScrollView,
  TouchableOpacity
} from 'react-native';
import _ from 'lodash';

const STRESSFUL_STRING_LENGTH = 7800

function buildStringByLength(length) {
  str = ""
  charcode = 65
  for (let i=0; i < length; i++) {
    str += String.fromCharCode(charcode)
    charcode ++
    if (charcode == 91) charcode = 65
  }
  return str
}

class example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
      passToBridge: undefined
    };
  }

  renderTestButton(label, onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <Text style={{color: 'blue', marginBottom: 20}}>{label}</Text>
      </TouchableOpacity>
    )
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 30}}>
          Welcome
        </Text>
        {this.renderTestButton('Say Hello', this.onButtonPress.bind(this, 'Hello'))}
        {this.renderTestButton('Say World', this.onButtonPress.bind(this, 'World'))}
        {this.renderTestButton('stressful', this.stressfulButtonPressed.bind(this, 'Hello World'))}
      </View>
    );
  }
  renderAfterButton() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <ScrollView>
          <Text style={{fontSize: 10, width: 300, height: 10}}>
            Bridge: {this.state.passToBridge}
          </Text>
          <Text style={{fontSize: 25}}>
            {this.state.greeting}!!!
          </Text>
        </ScrollView>
      </View>
    );
  }

  onButtonPress(greeting) {
    this.setState({
      greeting: greeting
    });
  }

  stressfulButtonPressed(greeting) {
    this.onButtonPress(greeting)

    // var data = require('./resources/stressful-text.json').text
    const data = buildStringByLength(STRESSFUL_STRING_LENGTH)
    this.setState({
      passToBridge: data
    })
  }
}

AppRegistry.registerComponent('example', () => example);
