import React, { Component } from 'react';
import {
  Platform,
  Text,
  View,
  TextInput,
  ScrollView
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import Slider from '@react-native-community/slider';
import {default as DatePicker} from '@react-native-community/datetimepicker';
let LegacySlider;
try {
  LegacySlider = require('react-native').Slider;
} catch (e) {
  // Ignore
}

export default class AttributesScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      checkBoxValue: false
    };
  }

  render() {
    const datePicker = Platform.OS === 'ios' ?
      (<DatePicker key='datePicker' testID='attrDatePicker' style={{ width: '100%', height: 200 }}
                   value={new Date(2022, 0, 1)} />)
      : undefined;

    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        {datePicker}
        <View testID={'viewId'} width={100} height={100} />
        <View style={{ height: 100, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff' }}>
          <ScrollView testID='attrScrollView'>
            <View testID={'innerView1'} width={100} height={75} style={{ backgroundColor: '#8cc' }} />
            <View testID={'innerView2'} width={100} height={75} style={{ backgroundColor: '#c8c' }} />
          </ScrollView>
        </View>
        <Text testID={'textViewId'} accessibilityLabel={'TextView'}>TextView</Text>
        <View testID={'textGroupRoot'} marginLeft={20} accessible={true}>
          <Text accessibilityLabel={'InnerText1'}>Some inner text</Text>
          <Text accessibilityLabel={'InnerText2'}>Some more inner text</Text>
        </View>
        <CheckBox
          disabled={false}
          testID={'checkboxId'}
          value={this.state.checkBoxValue}
          onValueChange={(value) => this.setState({
            checkBoxValue: value
          })}
        />
        <TextInput
          testID={'focusedTextInputId'} value={'focused'} placeholder={'palace-holder'}
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 10,
            marginHorizontal: 20,
            padding: 5
          }}
          autoFocus={true}
        />
        <TextInput
          testID={'blurredTextInputId'} value={'blurred'} placeholder={'palace-holder'}
          style={{
            height: 40,
            borderColor: 'gray',
            borderWidth: 1,
            marginBottom: 10,
            marginHorizontal: 20,
            padding: 5
          }}
          autoFocus={false}
        />
        {LegacySlider && <LegacySlider testID={'legacySliderId'} value={0.5} />}
        <Slider testID={'sliderId'} value={0.5} />
      </View>
    );
  }
}
