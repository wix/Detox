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

        <TouchableOpacity onPress={this.onIntervalSkipOver.bind(this, 'Interval Skipped-Over')}>
          <Text testID='SkipOverInterval' style={{color: 'blue', marginBottom: 20}}>Interval Skip-Over</Text>
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
    setTimeout(() => this.setState({greeting}), timeout);
  }

  onTimeoutIgnoreButtonPress(greeting, timeout) {
    setTimeout(() => console.log('this will happen soon'), timeout);
    this.setState({greeting});
  }

  onImmediateButtonPress(greeting) {
    setImmediate(() => this.setState({greeting}));
  }

  onIntervalIgnoreButtonPress(greeting, interval) {
    setInterval(() => console.log('this is recurring'), interval);
    this.setState({greeting});
  }

  onIntervalSkipOver(greeting) {
    const busyPeriodTimeoutHandler = () => this.setState({greeting});
    const idledTimeoutHandler = (timeMs) => console.log(`Non-busy keeping timer of ${timeMs}ms has expired`);

    const interval = 88;
    const busyKeepingTime = 600;
    const idledTimeBase = 1500 + 1;
    const foreverTimer = 2500;
    let intervalId;

    intervalId = setInterval(() => console.log(`this should show every ${interval}ms`), interval);
    setTimeout(() => idledTimeoutHandler(idledTimeBase), idledTimeBase);
    setTimeout(() => busyPeriodTimeoutHandler(), busyKeepingTime);
    setTimeout(() => idledTimeoutHandler(idledTimeBase + 10), idledTimeBase + 10);
    setTimeout(() => idledTimeoutHandler(idledTimeBase + 100), idledTimeBase + 100);
    setTimeout(() => {
      console.log('"Forever" timer expired - though it shouldn\'t have!');
      clearInterval(intervalId);
      this.setState({greeting: '???'});
    }, foreverTimer);
  }
}
