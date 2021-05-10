import React, { Component } from 'react';
import {
  Text,
  View
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

export default class AttributesScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: false
    }
  }

  changeCheckboxState() {
    this.setState({
      checked: !this.state.checked
    })
  }

  render() {
    return (
      <>
        <View
          testID={'viewId'}
          width={100}
          height={100}
        />
        <Text
          testID={'textViewId'}
          accessibilityLabel={'TextView'}
        >TextView</Text>
        <CheckBox
          testID={'checkboxId'}
        />
      </>
    );
  }
}
