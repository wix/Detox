import React, { Component } from 'react';
import {
  Linking,
  Text,
  View,
} from 'react-native';

export default class LaunchUrlScreen extends Component {

 constructor(props) {
   super(props);

   Linking.addEventListener('url', (params) => this._handleOpenURL(params));

   this.state = {
     url: undefined,
   }
 }

  async componentDidMount() {
    const url = await Linking.getInitialURL();
    this.setState({
      url,
    });
  }

  renderText(text) {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {text}
        </Text>
      </View>
    );
  }

  render() {
    return this.renderText(this.state.url);
  }

  _handleOpenURL(params) {
    console.log('App@handleOpenURL:', params);
    this.setState({url: params.url});
  }
}
