import moment from 'moment';
import React, { Component } from 'react';
import { Text, View, StyleSheet, Button, Platform } from 'react-native';
import { default as DatePicker } from "@react-native-community/datetimepicker";

export default class DatePickerScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chosenDate: new Date(),
      showDatePicker: false
    };

    this.setDate = this.setDate.bind(this);
  }

  setDate(e, newDate) {
    this.setState({
      chosenDate: newDate
    });
  }

  getTimeLocal() {
    return moment(this.state.chosenDate).format("hh:mm");
  }

  getDateLocal() {
    return moment(this.state.chosenDate).format("MMM Do, YYYY");
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.dateText} testID="utcDateLabel">
          {"Date (Local): " + this.getDateLocal()}
        </Text>
        <Text style={styles.dateText} testID='localTimeLabel'>
          {"Time (Local): " + this.getTimeLocal()}
        </Text>
         <View style={styles.openDatePickerButtonContainer}>
            <Button 
              title="Open datepicker"
              testID='showDatePicker'
              onPress={() => this.setState({ showDatePicker: true })}
            />
        </View>
        {this.state.showDatePicker && (
          <DatePicker 
            testID="datePicker" 
            mode='date' 
            display={Platform.OS === 'ios' ? "spinner" : "default"} 
            value={this.state.chosenDate} 
            onChange={this.setDate} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  openDatePickerButtonContainer: {
    paddingTop: 20,
  },
  dateText: {
    textAlign:'center'
  }
});
