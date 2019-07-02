import moment from "moment";
import React, { Component } from "react";
import { Text, View, StyleSheet, Picker } from "react-native";

export default class PickerViewScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chosenValue: "com.wix.detox.a"
    };

    this.setValue = this.setValue.bind(this);
  }

  setValue(newValue) {
    this.setState({
      chosenValue: newValue
    });
  }

  render() {
    return (
      <View style={styles.container}>
        <Text style={styles.dateText} testID="valueLabel">
          {this.state.chosenValue}
        </Text>
        <Picker
          testID="pickerView"
          selectedValue={this.state.chosenValue}
          style={{width:"100%", height:200}}
          onValueChange={this.setValue}>
          
          <Picker.Item label="a" value="com.wix.detox.a" />
          <Picker.Item label="b" value="com.wix.detox.b" />
          <Picker.Item label="c" value="com.wix.detox.c" />
          <Picker.Item label="d" value="com.wix.detox.d" />
        </Picker>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
    justifyContent: "center",
    alignItems: "center"
  },
  datePicker: {
    width:"100%",
    height:200
  },
  dateText: {
    textAlign:"center"
  }
});
