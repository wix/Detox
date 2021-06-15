import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput
} from 'react-native';

export default class ExpectationsScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      renderTextFields: false
    };
  }

  render() {
    if (this.state.renderTextFields) return this.renderTextFields();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity onPress={this.onTextFieldsPress.bind(this)} accessible={true} accessibilityRole={'button'}>
          <Text testID={'TextFields'} style={{color: 'blue', marginBottom: 20}}>Text Fields</Text>
        </TouchableOpacity>
      </View>
    );
  }

  renderTextFields() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <TextInput style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }}
                   value={'First Text Field..'}
                   testID={'TextField_Id1'}
        />
        <TextInput style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 10, marginHorizontal: 20, padding: 5 }}
                   value={'Second Text Field...'}
                   testID={'TextField_Id2'}
        />
      </View>
    );
  }

  onTextFieldsPress() {
    this.setState({
      renderTextFields: true
    });
  }

}
