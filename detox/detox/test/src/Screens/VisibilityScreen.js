import React, { Component } from 'react';
import {
  Text,
  View,
  ScrollView,
  StyleSheet,
  SafeAreaView
} from 'react-native';

export default class VisibilityScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <SafeAreaView testID='VisibilityScreen' style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenScroll} testID='screenScroll'>
          <Text style={styles.header}>Button 2 overlaying Button 1</Text>
          <Text style={styles.text}>An attempt to tap Button 1 should fail and produce artifacts.</Text>
          <View style={styles.buttonOverlayContainer}>
            <Text style={styles.absoluteButton}>Button 1</Text>
            <Text style={styles.absoluteButton}>Button 2</Text>
          </View>
        </ScrollView>
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
  buttonOverlayContainer: {
    flexDirection: 'row',
    paddingVertical: 6,
    justifyContent: 'center',
  },
  absoluteButton: {
    position: 'absolute',
    paddingHorizontal: 10,
    backgroundColor: '#ccc',
    textAlign: 'center',
    lineHeight: 30,
    height: 30,
  },
});
