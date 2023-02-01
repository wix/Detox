import React, { Component } from 'react';
import { requireNativeComponent, View } from 'react-native';

const NativeAnimatingView = requireNativeComponent('DetoxNativeAnimatingView');

class NativeAnimationsScreen extends Component {
  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'stretch' }}>
        <NativeAnimatingView style={{flex: 1}}/>
      </View>
    );
  }
}

module.exports = NativeAnimationsScreen;
