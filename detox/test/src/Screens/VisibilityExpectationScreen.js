import React, { Component } from 'react';
import {
  Button,
  Text,
  View,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

import ScrollBarGradient from '../Views/ScrollBarGradient';
import BadgeButton from "../Views/BadgeButton";

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
        <View style={styles.halfVisible, { left: shouldMoveElement ? "75%" : "50%" }} testID='halfVisible'>
          <Text>Half Visible Element</Text>
        </View>

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
    justifyContent: 'flex-start'
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
    position: 'relative',
    backgroundColor: '#ccc',
    textAlign: 'center',
    lineHeight: 30,
    height: 100
  },
});
