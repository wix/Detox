import React, {Component} from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeModules
} from 'react-native';

const {NativeModule} = NativeModules;

export default class SwitchRootScreen extends Component {
  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity onPress={this.onButtonPress.bind(this)}>
          <Text style={{color: 'blue', marginBottom: 20}}>{`Switch Root NOW!`}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  onButtonPress() {
    console.log('SwitchRootScreen onButtonPress (console.log test)');
    NativeModule.switchRoot();
  }
}

