import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView
} from 'react-native';

export default class WaitForScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      greeting: undefined,
      showsUp: false
    };
    setTimeout(() => {
      this.setState({showsUp: true});
    }, 1000);
  }

  render() {
    if (this.state.greeting) return this.renderAfterButton();
    return (
      <View style={{flex: 1, paddingTop: 40, justifyContent: 'flex-start'}}>

        {!this.state.showsUp ? false :
          <Text testID='UniqueId336' style={{marginBottom: 20, textAlign: 'center'}}>I appear after 1 sec</Text>
        }

        <View style={{height: 100, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff', marginBottom: 20}}>
          <ScrollView testID='ScrollView630'>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text1</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text2</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text3</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text4</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text5</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text6</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text7</Text>
            <Text style={{height: 30, backgroundColor: '#e8e8f8', padding: 5, margin: 10}}>Text8</Text>
          </ScrollView>
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

}
