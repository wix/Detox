import moment from 'moment';
import React, { Component } from 'react';
import { Text, View, StyleSheet, DatePickerIOS, Platform, Button } from 'react-native';
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

const isAndroid = Platform.OS === 'android';
const isIos = Platform.OS === 'ios';

export default class DatePickerScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chosenDate: new Date()
    };

    this.setDate = this.setDate.bind(this);
  }

  setDate(newDate) {
    this.setState({
      chosenDate: newDate
    });
  }

  getTimeLocal() {
    return moment(this.state.chosenDate).format("hh:mm");
  }

  getTimeUTC() {
    return moment(this.state.chosenDate).utc().format("h:mm A");
  }

  getDateUTC() {
    return moment(this.state.chosenDate).utc().format("MMM Do, YYYY");
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.dateText} testID="utcDateLabel">
          {"Date (UTC): " + this.getDateUTC()}
        </Text>
        <Text style={styles.dateText} testID='utcTimeLabel'>
          {"Time (UTC): " + this.getTimeUTC()}
        </Text>
        <Text style={styles.dateText} testID='localTimeLabel'>
          {"Time: " + this.getTimeLocal()}
        </Text>
        { isAndroid && <View style={styles.openDatePickerButtonContainer}>
            <Button 
              title="Open datepicker"
              testID='openAndroidDatePicker'
              onPress={() => {
                DateTimePickerAndroid.open({
                  value: this.state.chosenDate,
                  onChange: (_, newDate) => this.setDate(newDate),
                  mode: "date",
                });
              }}
            />
        </View>}
        {isIos && <DatePickerIOS testID="datePicker" style={styles.datePickerIos} date={this.state.chosenDate} onDateChange={this.setDate} />}
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
  datePickerIos: {
    width:'100%',
    height:200
  },
  openDatePickerButtonContainer: {
    paddingTop: 20,
  },
  dateText: {
    textAlign:'center'
  }
});
