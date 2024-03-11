import React, { Component } from 'react';
import {
  Text,
  View,
} from 'react-native';

export default class Orientation extends Component {

  constructor(props) {
    super(props);
    this.state = {
      horizontal: false
    };
    console.log('Orientation react component constructed (console.log test)');
  }

  detectHorizontal({nativeEvent: {layout: {width, height}}}) {
    this.setState({
      horizontal: width > height
    });
  }

  render() {
    return (
      <View onLayout={this.detectHorizontal.bind(this)} style={{flex: 1, paddingTop: 20, justifyContent: 'flex-start', alignItems: 'center'}}>
        <Text testID="currentOrientation" style={{fontSize: 25, marginTop: 50}}>
          {this.state.horizontal ? 'Landscape' : 'Portrait'}
        </Text>
      </View>
    );
  }
}
