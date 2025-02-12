import React, { Component } from 'react';
import { Text, View, NativeModules, Platform } from 'react-native';

export default class LanguageScreen extends Component {
  state = {
    locale: '',
    language: ''
  };

  async componentDidMount() {
    try {
      const locale = await Platform.select({
        ios: async () => await NativeModules.NativeModule.getUserLocale(),
        android: () => Promise.resolve('Unavailable')
      })();

      const language = await Platform.select({
        ios: async () => await NativeModules.NativeModule.getUserLanguage(),
        android: () => Promise.resolve('Unavailable')
      })();

      this.setState({ locale, language });
    } catch (error) {
      console.error('Error fetching locale/language:', error);
    }
  }

  render() {
    const { locale, language } = this.state;

    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>
          Current locale: {locale || 'Loading...'}
        </Text>
        <Text style={{ fontSize: 25, marginBottom: 30 }}>
          Current language: {language || 'Loading...'}
        </Text>
      </View>
    );
  }
}
