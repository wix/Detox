import React, { Component } from 'react';
import {
  Text,
  View,
  ScrollView,
} from 'react-native';

export default class ScrollActionsScreen extends Component {

  render() {
    return (
      <View style={{ flex: 1, justifyContent: 'flex-start', borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff' }}>
        <ScrollView testID='FSScrollActions.scrollView'>
          {
            Array.from({length: 20}, (_, index) => this.renderItem(index + 1))
          }
        </ScrollView>
      </View>
    );
  }

  renderItem(id) {
    return <Text key={`listItem.${id}`} style={{ height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10 }}>{`Text${id}`}</Text>;
  }
}
