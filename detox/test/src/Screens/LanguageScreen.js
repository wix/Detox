import React, { Component } from 'react';
import { Text, View, Platform } from 'react-native';
import { NativeModules } from 'react-native';
import _ from 'lodash';

export default class LanguageScreen extends Component {
  render() {
    const locale = Platform.select({
        ios: () => NativeModules.SettingsManager.settings.AppleLocale,
        android: () => NativeModules.I18nManager.localeIdentifier
    })();

    const language = Platform.select({
        ios: () => _.take(NativeModules.SettingsManager.settings.AppleLanguages, 1),
        android: () => 'N/A'
    })();

    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>Current locale: {locale}</Text>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>
          Current language: {language}
        </Text>
      </View>
    );
  }
}
