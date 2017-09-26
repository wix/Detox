import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  Platform
} from 'react-native';

// TODO Use 10.0.3.2 for Genymotion
const HOST = Platform.OS === 'ios' ? 'localhost': '10.0.2.2';

export default class NetworkScreen extends Component {

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

        <TouchableOpacity onPress={this.onNetworkButtonPress.bind(this, 'Short Network Request Working', 100)}>
          <Text testID='ShortNetworkRequest' style={{color: 'blue', marginBottom: 20}} accessibilityLabel={'Short Network Request'}>Short Network Request</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onNetworkButtonPress.bind(this, 'Long Network Request Working', 3000)}>
          <Text testID='LongNetworkRequest' style={{color: 'blue', marginBottom: 20}} accessibilityLabel={'Long Network Request'}>Long Network Request</Text>
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

  async onNetworkButtonPress(greeting, delayMs) {
    try {
      let response = await fetch(`http://${HOST}:9001/delay/${delayMs}`);
      let responseJson = await response.json();
      console.log(responseJson.message);

      this.setState({
        greeting: greeting
      });
    } catch(error) {
      console.error(error);
    }
  }
}
