import React, { Component } from 'react';
import { View, TouchableOpacity, StyleSheet, Text , findNodeHandle, UIManager} from 'react-native';

export default class DeviceScreen extends Component {

  constructor(props) {
    super(props);
    this.state ={
      buttonText: 'Tap Me'
    };
    this.onButtonPressed = this.onButtonPressed.bind(this);
  }

  onButtonPressed() {
    this.setState({
      buttonText: 'Tap works'
    })
  }

  render() {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={this.onButtonPressed} style={styles.button}>
          <Text style={styles.text}>{this.state.buttonText}</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center"
  },
  button: {
    padding: 10,
    backgroundColor: '#aaaaaa',
    height: 200,
    width: "40%",
    justifyContent: "center",
    alignItems: "center"
  },
  text: {
    color: 'blue',
    textAlign: 'center'
  }
});
