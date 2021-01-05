import React, { Component } from 'react';
import {
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StyleSheet,
  SafeAreaView,
  View,
} from 'react-native';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  container: {
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'ios' ? 30 : 0,
  },

  textButton: {
    color: 'blue',
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default class SyncScreen extends Component {
  state = {
    showIndicator: false,
  }

  render() {
    return (
      <SafeAreaView style={styles.container}>
        <View testID="SyncScreenContainer" style={styles.container}>
          <TouchableOpacity testID="showIndicator" onPress={() => this.setState({ showIndicator: true })}>
            <Text style={styles.textButton}>Show Activity Indicator</Text>
          </TouchableOpacity>

          { this.state.showIndicator && <ActivityIndicator testID="indicator" key="indicator" size="large" color="black" /> }
        </View>
      </SafeAreaView>
    );
  }
}
