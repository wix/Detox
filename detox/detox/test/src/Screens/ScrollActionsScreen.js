import React, { Component } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export default class ScrollActionsScreen extends Component {

  constructor(props) {
    super(props);

    this.onPress = this.onPress.bind(this);
    this.onLongPress = this.onLongPress.bind(this);
  }


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
    const key = `listItem.${id}`;
    return (
      <TouchableOpacity
        key={key}
        testID={key}
        onPress={() => this.onPress(id)}
        onLongPress={() => this.onLongPress(id)}
      >
        <Text style={{ height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10 }}>{`Text${id}`}</Text>
      </TouchableOpacity>
    );
  }

  onPress(id) {
    Alert.alert('Alert', `Alert(Item #${id})`)
  }

  onLongPress(id) {
    // DO NOT REMOVE THIS!
    // While there are no tests that actually trigger this, it's important nonetheless -- for *negative* testing of bugs
    // such as this one: https://github.com/wix/Detox/issues/1406 (i.e. long-press invoked unwillingly)
    Alert.alert('Alert', `Alert-LongPress(Item #${id})`)
  }
}
