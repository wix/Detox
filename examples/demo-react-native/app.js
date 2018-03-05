/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 * @flow
 */

import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  DatePickerIOS
} from 'react-native';

class example extends Component {
  constructor(props) {
    super(props);
    this.state = {
      goToScreen: undefined,
      greeting: undefined,
      chosenDate: new Date()
    };
    this._setDate = this._setDate.bind(this);
  }

  _setDate(newDate) {
    this.setState({
      chosenDate :newDate
    })
  }

  

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return this.state.goToScreen === 'datePicker' ? (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <DatePickerIOS testID = {'CustomDatePicker'}
          style = {styles.datePicker}
          date={this.state.chosenDate}
          onDateChange={this._setDate}
        />
        <TouchableOpacity testID='back_button' onPress={() => {this.setState({goToScreen: false})}}  >
          <Text style={{color: 'blue', marginBottom: 20}}>back</Text>
        </TouchableOpacity>
      </View>
    ) : (
      <View testID='welcome' style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 30}}>
          Welcome
        </Text>
        <TouchableOpacity testID='hello_button' onPress={this.onButtonPress.bind(this, 'Hello')}>
          <Text style={{color: 'blue', marginBottom: 20}}>Say Hello</Text>
        </TouchableOpacity>
        <TouchableOpacity testID='world_button' onPress={this.onButtonPress.bind(this, 'World')}>
          <Text style={{color: 'blue', marginBottom: 20}}>Say World</Text>
        </TouchableOpacity>
        <TouchableOpacity testID='datePickerIOS' onPress={this.openDatePicker.bind(this)}>
          <Text style={{color: 'blue', marginBottom: 20}}>Test DatePicker</Text>
        </TouchableOpacity>
      </View>
    );
  }
  openDatePicker() {
    this.setState({
      goToScreen: 'datePicker'
    });
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
}

const styles = StyleSheet.create({
  datePicker: {
    width:'100%',
    height:200,
    backgroundColor:'green',
  }
});

AppRegistry.registerComponent('example', () => example);
