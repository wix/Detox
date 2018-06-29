import React, { Component } from 'react';
import {
  Text,
  View,
  StyleSheet,
  Picker,
  PickerItem
} from 'react-native';

export default class PickerScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectedValue: "Foo"
    }
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text testID="FooLabel">
          {this.state.selectedValue}
        </Text>
        <Picker
          testID="FooPicker"
          selectedValue={this.state.selectedValue}
          onValueChange={(selectedValue) => this.setState({ selectedValue })}
          style={{ width: '100%', height: 200}}>
          <PickerItem value="Foo" label="Foo" />
          <PickerItem value="Bar" label="Bar" />
          <PickerItem value="Baz" label="Baz" />
        </Picker>
      </View>
    );
  }
}
