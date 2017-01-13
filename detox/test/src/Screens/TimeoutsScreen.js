import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity
} from 'react-native';

export default class TimeoutsScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
    };
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>

        <TouchableOpacity onPress={this.onTimeoutButtonPress.bind(this, 'Short Timeout Working', 600)}>
          <Text testID='TimeoutShort' style={{color: 'blue', marginBottom: 20}}>Short Timeout</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onTimeoutButtonPress.bind(this, 'Zero Timeout Working', 0)}>
          <Text testID='TimeoutZero' style={{color: 'blue', marginBottom: 20}}>Zero Timeout</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onTimeoutIgnoreButtonPress.bind(this, 'Short Timeout Ignored', 600)}>
          <Text testID='TimeoutIgnoreShort' style={{color: 'blue', marginBottom: 20}}>Short Timeout Ignore</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onTimeoutIgnoreButtonPress.bind(this, 'Long Timeout Ignored', 100000)}>
          <Text testID='TimeoutIgnoreLong' style={{color: 'blue', marginBottom: 20}}>Long Timeout Ignore</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onImmediateButtonPress.bind(this, 'Immediate Working')}>
          <Text testID='Immediate' style={{color: 'blue', marginBottom: 20}}>Immediate</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onIntervalIgnoreButtonPress.bind(this, 'Interval Ignored', 1000)}>
          <Text testID='IntervalIgnore' style={{color: 'blue', marginBottom: 20}}>Interval Ignore</Text>
        </TouchableOpacity>

      </View>
    );
  }

  renderAfterButton() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {this.state.greeting}!!!
        </Text>
      </View>
    );
  }

  onTimeoutButtonPress(greeting, timeout) {
    setTimeout(() => {
      this.setState({
        greeting: greeting
      });
    }, timeout);
  }

  onTimeoutIgnoreButtonPress(greeting, timeout) {
    setTimeout(() => {
      console.log('this will happen soon');
    }, timeout);
    this.setState({
      greeting: greeting
    });
  }

  onImmediateButtonPress(greeting) {
    setImmediate(() => {
      this.setState({
        greeting: greeting
      });
    });
  }

  onIntervalIgnoreButtonPress(greeting, interval) {
    setInterval(() => {
      console.log('this is recurring');
    }, interval);
    this.setState({
      greeting: greeting
    });
  }

}
