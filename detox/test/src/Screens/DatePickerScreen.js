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
    this.state = {
      chosenDate: new Date()
    }
    this._setDate = this._setDate.bind(this);
  }

  _setDate(newDate) {
    this.setState({
      chosenDate :newDate
    })
  }

  getTime() {
    minutes = this.state.chosenDate.getMinutes()
    hour = this.state.chosenDate.getHours()
    if( hour > 12 ) {
      hour = hour - 12;
    }
    return `${hour}:${minutes}`
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style = {styles.dateText} testID='timeLabel'>
          {"choosenTime is " + this.getTime()}
        </Text>
        <DatePickerIOS 
         style = {styles.datePicker}
         date = {this.state.chosenDate}
         onDateChange={this._setDate}
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
    },
    dateText: {
      textAlign: 'center',
    }  
});
