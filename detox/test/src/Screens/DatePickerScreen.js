import upperFirst from 'lodash/upperFirst';
import moment from 'moment';
import React, { Component } from 'react';
import { Text, View, StyleSheet, Button, Platform } from 'react-native';
import { default as DatePicker } from "@react-native-community/datetimepicker";

const shouldHideDatePicker = Platform.OS === 'android';

export default class DatePickerScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chosenDate: new Date(),
      datePickerVisible: !shouldHideDatePicker,
      datePickerDisplay: DatePickerScreen.MODES[0],
    };
  }

  _toggleDatePicker = () => {
    const currentIndex = DatePickerScreen.MODES.indexOf(this.state.datePickerDisplay);
    this.setState({
      datePickerDisplay: DatePickerScreen.MODES[(currentIndex + 1) % DatePickerScreen.MODES.length],
    });
  }

  _openDatePicker = () => {
    this.setState({ datePickerVisible: true });
  }

  setDate = (e, newDate) => {
    this.setState({
      chosenDate: newDate,
      datePickerVisible: !shouldHideDatePicker,
    });
  };

  getTimeLocal() {
    return moment(this.state.chosenDate).format("h:mm A");
  }

  getDateLocal() {
    return moment(this.state.chosenDate).format("MMM Do, YYYY");
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
        <Text style={styles.dateText} testID="localDateLabel">
          {"Date (Local): " + this.getDateLocal()}
        </Text>
        <Text style={styles.dateText} testID='localTimeLabel'>
          {"Time (Local): " + this.getTimeLocal()}
        </Text>
        <View style={styles.container}>
          <Button
            title={`${upperFirst(this.state.datePickerDisplay)} Date Picker`}
            testID='toggleDatePicker'
            onPress={this._toggleDatePicker}
          />
        </View>
        {shouldHideDatePicker && (
          <View style={styles.container}>
            <Button
              title="Open Date Picker"
              testID='openDatePicker'
              onPress={this._openDatePicker}
            />
          </View>
        )}
        {this.state.datePickerVisible && (
          <DatePicker
            testID="datePicker"
            mode='date'
            // @ts-ignore
            display={this.state.datePickerDisplay}
            value={this.state.chosenDate}
            onChange={this.setDate} />
          )}
      </View>
    );
  }

  static MODES = Platform.OS === 'ios'
    ? ['compact', 'inline', 'spinner']
    : ['calendar', 'spinner'];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 100,
    paddingBottom: 50,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dateText: {
    textAlign:'center'
  }
});
