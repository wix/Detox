import React, { Component } from 'react';
import {
  AppRegistry,
  Text,
  View,
  TouchableOpacity
} from 'react-native';
import * as Screens from './src/Screens'

import SanityScreen from './src/Screens/SanityScreen'
import StressScreen from './src/Screens/StressScreen'

class example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      screen: undefined
    };
  }

  renderScreenButton(screen) {
    return (
      <TouchableOpacity onPress={() => {
        this.setState({
          screen
        });
      }}>
        <Text style={{color: 'blue', marginBottom: 20}}>{screen}</Text>
      </TouchableOpacity>
    )
  }

  render() {
    if (!this.state.screen) {
      return (
        <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{fontSize: 25, marginBottom: 30}}>
            Please Choose a test
          </Text>
          {this.renderScreenButton(Screens.SANITY_SCREEN)}
          {this.renderScreenButton(Screens.STRESS_SCREEN)}
        </View>
      );
    }

    switch (this.state.screen) {
      case Screens.SANITY_SCREEN:
        return (
          <SanityScreen></SanityScreen>
        );
      case Screens.STRESS_SCREEN:
        return (
          <StressScreen></StressScreen>
        );
    }
  }
}

AppRegistry.registerComponent('example', () => example);
