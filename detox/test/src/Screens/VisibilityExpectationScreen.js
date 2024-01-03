import React, { Component } from 'react';
import {
  Button,
  Text,
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

export default class VisibilityExpectationScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      shouldMoveElement: false
    };
  }

  render() {
    const shouldMoveElement = this.state.shouldMoveElement;

    return (
      <SafeAreaView testID='VisibilityExpectationScreen' style={styles.screen}>
        <Text style={styles.header}>Half Visible Element</Text>
        <Text style={styles.text}>Element should be only half-visible.</Text>
        <View style={[styles.fullWidth, shouldMoveElement ? styles.quarterVisible : styles.halfVisible]} testID='halfVisible' />
        <Text style={styles.header}>Move Element Button</Text>
        <Text style={styles.text}>Element should be 1/4 visible after button is pressed.</Text>
        <Button title={"Move That Element"} testID={"moveHalfVisible"} onPress={() => { this.setState({shouldMoveElement: true}) }} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'flex-start',
    borderColor: 'red',
    borderWidth: 1,
  },
  header: {
    fontSize: 18,
    paddingLeft: 18,
    marginTop: 18,
    marginBottom: 0,
  },
  text: {
    fontSize: 12,
    paddingLeft: 18,
    marginVertical: 12,
  },
  halfVisible: {
    left: '50%',
  },
  quarterVisible: {
    left: '75%',
  },
  fullWidth: {
    alignSelf: 'stretch',
    backgroundColor: 'purple',
    height: 30,
    minWidth: 30,
  }
});
