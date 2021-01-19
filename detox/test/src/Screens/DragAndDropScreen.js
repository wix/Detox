import React, {Component} from 'react';
import {
  View,
  Text,
  NativeModules
} from 'react-native';

export default class DragAndDropScreen extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text>{'Drag And Drop Screen'}</Text>
      </View>
    );
  }
}
