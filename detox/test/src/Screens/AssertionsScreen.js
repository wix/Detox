import React, { Component } from 'react';
import {
  Text,
  View,
  Switch
} from 'react-native';

export default class AssertionsScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      switchValue: false
    }
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>

        <Text testID='UniqueId204' style={{marginBottom: 20}}>I contain some text</Text>

        <Text testID='UniqueId205' style={{marginBottom: 20, position: 'absolute', left: -200}}>I am not visible</Text>

        <Switch testID='UniqueId146'
          onValueChange={(value) => this.setState({switchValue: value})}
          value={this.state.switchValue} />

      </View>
    );
  }

}
