import React, { Component } from 'react';
import {
  AppRegistry,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import * as Screens from './src/Screens'

class example extends Component {

  constructor(props) {
    super(props);
    this.state = {
      screen: undefined
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

  render() {
    if (!this.state.screen) {
      return (
        <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 20, marginBottom: 30}}>
            Choose a test
          </Text>
          {this.renderScreenButton('Sanity', Screens.SanityScreen)}
          {this.renderScreenButton('Matchers', Screens.MatchersScreen)}
          {this.renderScreenButton('Stress', Screens.StressScreen)}
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
