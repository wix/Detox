import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity
} from 'react-native';

export default class SanityScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
    };
    console.log('SanityScreen react component constructed (console.log test)');
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

  onButtonPress(greeting) {
    console.log('SanityScreen onButtonPress "' + greeting + '" (console.log test)');
    this.setState({
      greeting: greeting
    });
  }

}
