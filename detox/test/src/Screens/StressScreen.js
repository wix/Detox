import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity
} from 'react-native';

const STRESSFUL_STRING_LENGTH = 48000; // Min: 32000
const STRESSFUL_EVENTS_COUNT = 570; // Min: 380

function buildStringByLength(length) {
  str = "";
  charcode = 65;
  for (let i=0; i < length; i++) {
    str += String.fromCharCode(charcode);
    charcode ++;
    if (charcode == 91) charcode = 65;
  }
  return str;
}

export default class StressScreen extends Component {
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
        {this.renderTestButton('Bridge Stress', this.bridgeStressButtonPressed.bind(this, 'Hello World'))}
        {this.renderTestButton('Events Stress', this.eventsStressButtonPressed.bind(this, 'Hello World'))}
      </View>
    );
  }
  renderAfterButton() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 10, width: 0, height: 0}}>
          Bridge: {this.state.passToBridge}
        </Text>
        <Text style={{fontSize: 25}}>
          {this.state.greeting}!!!
        </Text>
      </View>
    );
  }

  onButtonPress(greeting) {
    this.setState({
      greeting: greeting
    });
  }

  bridgeStressButtonPressed(greeting) {
    this.onButtonPress(greeting)

    const data = buildStringByLength(STRESSFUL_STRING_LENGTH);
    this.setState({
      passToBridge: data,
      greeting: greeting
    });
  }

  eventsStressButtonPressed(greeting) {
    // Stress:
    for (let i =0; i < STRESSFUL_EVENTS_COUNT; i++) {
      let myString = "";
      setImmediate(() => { myString = buildStringByLength(1000) });
    }

    setImmediate(() => { this.onButtonPress(greeting) });
  }

}
