import React, {Component} from 'react';
import { TextInput, NativeModules, Platform } from 'react-native';

const { NativeModule } = NativeModules;

class AndroidTextInput extends Component {
  constructor(props) {
    super(props);
    NativeModule.spyLongTaps(props.testID);
  }

  render() {
    return <TextInput {...this.props} nativeID={this.props.testID} />
  }
}

if (Platform.OS === 'android') {
  module.exports = AndroidTextInput;
} else {
  module.exports = TextInput;
}
