import React, { Component } from 'react';
import {
  Text,
  View,
  Switch,
} from 'react-native';

export default class AssertionsScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      switchValue: false
    }
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text testID='main-text' style={{marginBottom: 20}} accessibilityLabel={'I contain some text'}>I contain some text</Text>
        <View testID='subtext-root'>
          <Text style={{marginBottom: 20}}>I am a text subcomponent</Text>
        </View>
        <Text testID='offscreen-text' style={{marginBottom: 20, position: 'absolute', left: -200}}>I am not visible</Text>
        <TestSwitchWidget testID='toggle'/>
      </View>
    );
  }
}

class TestSwitchWidget extends Component {
  constructor(props) {
    super(props);
    this.state = {
      value: false
    }
    this.onChange = () => this.setState({ value: !this.state.value });
  }

  render() {
    return <Switch testID={this.props.testID} onChange={this.onChange} value={this.state.value}/>
  }
}
