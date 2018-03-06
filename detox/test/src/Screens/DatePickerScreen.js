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
        <DatePickerIOS 
         style = {styles.datePicker}
         date = {new Date()}
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
