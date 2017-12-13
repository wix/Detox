import React, { Component } from 'react';
import {
  Text,
  View,
  ScrollView,
} from 'react-native';

export default class MatchersScreen extends Component {
  constructor(props) {
    super(props);
  }
  render() {
    return (
      <View style={{ flex: 1, padding: 40 }}>
        <ScrollView testID={'parentScrollView'}>
          <Text>Top</Text>
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
            <ScrollView style={{ height: 100 }} horizontal testID={'childScrollView'}>
              <Text>Left</Text>
              <View style={{backgroundColor: '#f8f8ff', height: 100, width: 100}} />
              <View style={{backgroundColor: '#e8e8f8', height: 100, width: 100}} />
              <View style={{backgroundColor: '#f8f8ff', height: 100, width: 100}} />
              <View style={{backgroundColor: '#e8e8f8', height: 100, width: 100}} />
              <View style={{backgroundColor: '#f8f8ff', height: 100, width: 100}} />
              <View style={{backgroundColor: '#e8e8f8', height: 100, width: 100}} />
              <Text>Right</Text>
            </ScrollView>
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
          <View style={{backgroundColor: '#f8f8ff', height: 50}} />
          <View style={{backgroundColor: '#e8e8f8', height: 50}} />
          <Text>Bottom</Text>
        </ScrollView>
      </View>
    );
  }
}
