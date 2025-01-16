import React, { Component } from 'react';
import {
  Text,
  View,
  Switch,
  Image,
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
        <View testID='subtext-root' style={{marginBottom: 20}} accessible={true}>
          <Text accessibilityLabel={'This is some'}>This is some</Text>
          <Text accessibilityLabel={'subtext'}>subtext</Text>
        </View>
        <Image testID='example-image' source={{ uri: 'https://cdn.vectorstock.com/i/1000v/68/78/different-of-fruits-realistic-vector-21566878.jpg' }}
               style={{width: 100, height: 90, marginBottom: 20,}} accessibilityLabel="Example Image" />
        <Text testID='color-text1' style={{color: 'green', marginBottom: 20}}>
          Some more text here
        </Text>
        <Text testID='color-text2' style={{color: 'blue', marginBottom: 20}}>
          I am pink
        </Text>
        <Text testID='offscreen-text' style={{marginBottom: 20, position: 'absolute', left: -200}}>I am not visible</Text>
        <TestSwitchWidget testID='toggle'/>
        <Text style={{position: 'absolute', top: 20, left: 20, fontSize: 40,}} testID='smile-emoji'>😊</Text>
        <Text style={{ position: 'absolute', bottom: 20, right: 20, fontSize: 40,}} testID='celebration-emoji'>🎉</Text>
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
