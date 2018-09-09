import React, { Component } from 'react';
import { Text, View } from 'react-native';
import { NativeModules } from 'react-native';
import _ from 'lodash';

export default class LanguageScreen extends Component {
  render() {
    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>Current locale: {NativeModules.SettingsManager.settings.AppleLocale}</Text>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>
          Current language: {_.take(NativeModules.SettingsManager.settings.AppleLanguages, 1)}
        </Text>
      </View>
    );
  }
}
