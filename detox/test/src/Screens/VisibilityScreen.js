import React, { Component } from 'react';
import {
  Button,
  Image,
  Text,
  View,
  ScrollView,
  Dimensions,
  StyleSheet,
  SafeAreaView,
  TextInput
} from 'react-native';

import ScrollBarGradient from '../Views/ScrollBarGradient';
import BadgeButton from "../Views/BadgeButton";

export default class VisibilityScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <SafeAreaView testID='VisibilityScreen' style={styles.screen}>
        <ScrollView contentContainerStyle={styles.screenScroll} testID='screenScroll'>
          <Text style={styles.header}>Tab Bar with Gradient</Text>
          <Text style={styles.text}>Should be scrollable because pointerEvents="none"</Text>
          <View style={styles.scrollContainer}>
            <ScrollView contentContainerStyle={styles.scrollView} testID='tabBarWithGradient' horizontal>
              <Text style={styles.horizontalItem}>Tab 1</Text>
              <Text style={styles.horizontalItem}>Tab 2</Text>
              <Text style={styles.horizontalItem}>Tab 3</Text>
              <Text style={styles.horizontalItem}>Tab 4</Text>
              <Text style={styles.horizontalItem}>Tab 5</Text>
              <Text style={styles.horizontalItem}>Tab 6</Text>
              <Text style={styles.horizontalItem}>Tab 7</Text>
              <Text style={styles.horizontalItem}>Tab 8</Text>
            </ScrollView>
            <ScrollBarGradient left={false} />
            <ScrollBarGradient left={true} />
          </View>

          <Text style={styles.header}>Dismiss the on-screen keyboard</Text>
          <Text style={styles.text}>The upper &lt;ScrollView&gt; should be tappable even if the on-screen keyboard is on.</Text>
          <TextInput testID='inputExample' style={styles.input} placeholder={'Tap to turn on the keyboard'} />

          <Text style={styles.header}>Buttons with non-interactive badges</Text>
          <Text style={styles.text}>The button with a badge should be tappable.</Text>

          <View style={styles.badgesContainer} testID='badgeButtonsContainer'>
            <BadgeButton testID={'badgeButtonExample'} icon={require('../assets/search.png')} text="5" />
          </View>

          <Text style={styles.header}>Button 2 overlaying Button 1</Text>
          <Text style={styles.text}>An attempt to tap Button 1 should fail.</Text>
          <View style={styles.buttonOverlayContainer} testID='badgeButtonsContainer'>
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
  scrollContainer: {
    borderColor: '#c0c0c0',
    borderWidth: 1,
    backgroundColor: '#ddd',
    height: 46,
  },
  scrollView: {
    alignItems: 'center',
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
  input: {
    marginHorizontal: 18,
    padding: 12,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 5,
  },
  horizontalItem: {
    width: 0.25 * Dimensions.get('window').width - 20, // to have four items
    backgroundColor: '#e8ffff',
    marginHorizontal: 10,
    textAlign: 'center',
    lineHeight: 30,
    height: 30,
  },
  badgesContainer: {
    flexDirection: 'row',
    paddingVertical: 6,
    justifyContent: 'center',
    height: 40,
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
