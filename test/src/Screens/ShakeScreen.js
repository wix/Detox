import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  RefreshControl,
  NativeEventEmitter,
  NativeModules
} from 'react-native';
const { ShakeEventEmitter } = NativeModules;

const shakeEventEmitter = new NativeEventEmitter(ShakeEventEmitter);

export default class ShakeScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: "Shake it, baby"
    };
    this.subscription = undefined;
  }

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text testID='BondJamesBond' style={{ fontSize: 25 }}>
          {this.state.greeting}
        </Text>
      </View>
    );
  }

  componentWillMount() {
    this.subscription = shakeEventEmitter.addListener('ShakeEvent', () => {
      console.log("Shake!!!");
      this.setState({ greeting: "Shaken, not stirred" });
    });
  }

  componentWillUnmount() {
    console.log("Unsubscribing");
    this.subscription.remove();
  }
}
