import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity
} from 'react-native';

export default class MatchersScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
    };
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Label Working')}>
          <Text style={{color: 'blue', marginBottom: 20}}>Label</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'ID Working')}>
          <Text testID='UniqueId345' style={{color: 'blue', marginBottom: 10}}>ID</Text>
        </TouchableOpacity>

        {!this.state.hideStar ?
          <TouchableOpacity onPress={this.onStarPress.bind(this)}>
            <Image source={require('../assets/star.png')} style={{width: 50, height: 50, marginBottom: 10}} />
          </TouchableOpacity> : null
        }

        <View testID='Grandfather883' style={{padding: 8, backgroundColor: 'red', marginBottom: 10}}>
          <View testID='Father883' style={{padding: 8, backgroundColor: 'green'}}>
            <View testID='Son883' style={{padding: 8, backgroundColor: 'blue'}}>
              <View testID='Grandson883' style={{padding: 8, backgroundColor: 'purple'}} />
            </View>
          </View>
        </View>

        <View style={{flexDirection: 'row', marginBottom: 20}}>
          <Text testID='ProductId000' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId001' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId002' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId003' style={{margin: 10}}>Product</Text>
        </View>

      </View>
    );
  }

  renderAfterButton() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25}}>
          {this.state.greeting}!!!
        </Text>
      </View>
    );
  }

  onButtonPress(greeting) {
    this.setState({
      greeting: greeting
    });
  }

  onStarPress() {
    this.setState({
      hideStar: true
    });
  }

}
