import React, { Component } from 'react';
import {
  Text,
  View,
  StyleSheet,
  DatePickerIOS
} from 'react-native';

export default class DatePickerScreen extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <DatePickerIOS testID = {'CustomDatePicker'}
         style = {styles.datePicker}
         date = {new Date()}//{this.state.chosenDate}
         //onDateChange={this._setDate}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
    datePicker: {
      width:'100%',
      height:200,
      backgroundColor:'green',
    }  
});
