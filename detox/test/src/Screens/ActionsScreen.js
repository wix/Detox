import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput
} from 'react-native';

export default class ActionsScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
      typeText: '',
      clearText: 'some stuff here..',
      numTaps: 0
    };
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Tap Working')}
          onLongPress={this.onButtonPress.bind(this, 'Long Press Working')}
        >
          <Text style={{color: 'blue', marginBottom: 20}}>Tap Me</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onMultiTapPress.bind(this)}>
          <Text testID='UniqueId819' style={{color: 'blue', marginBottom: 20}}>Taps: {this.state.numTaps}</Text>
        </TouchableOpacity>

        <TextInput style={{height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, marginHorizontal: 20, padding: 5}}
          onChangeText={this.onChangeTypeText.bind(this)}
          value={this.state.typeText}
          testID='UniqueId937'
        />

        <TextInput style={{height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, marginHorizontal: 20, padding: 5}}
          onChangeText={this.onChangeClearText.bind(this)}
          value={this.state.clearText}
          testID='UniqueId005'
        />

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
    this.setState({
      greeting: greeting
    });
  }

  onMultiTapPress() {
    this.setState({
      numTaps: this.state.numTaps + 1
    });
  }

  onChangeTypeText(text) {
    this.setState({
      typeText: text
    });
    if (text == 'passcode') {
      this.setState({
        greeting: 'Type Working'
      });
    }
  }

  onChangeClearText(text) {
    this.setState({
      clearText: text
    });
    if (text == '') {
      this.setState({
        greeting: 'Clear Working'
      });
    }
  }

}
