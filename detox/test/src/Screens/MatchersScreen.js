import React, { Component } from 'react';
import {
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Switch,
  Button
} from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';

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
          <Text style={{color: 'blue', marginBottom: 20}} accessibilityLabel={'Label'}>Label</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'ID Working')}>
          <Text testID='UniqueId345' style={{color: 'blue', marginBottom: 20}}>ID</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Traits Working')} accessible={true} accessibilityRole={'button'}>
          <Text style={{color: 'blue', marginBottom: 10}}>Traits</Text>
        </TouchableOpacity>

        {!this.state.hideStar ?
          <TouchableOpacity onPress={this.onStarPress.bind(this)}>
            <Image source={require('../assets/star.png')} style={{width: 50, height: 50, marginBottom: 10}} />
          </TouchableOpacity> : null
        }

        <ActivityIndicator size="large" color="#0000ff" style={{marginBottom: 10}} />

        <Button title="Native Button" onPress={() => {}} testID="semanticNativeButton" />

        <ScrollView testID="semanticScrollView" style={{height: 40, width: 200, marginBottom: 10, backgroundColor: '#eee'}}>
          <Text>Scrollable content</Text>
        </ScrollView>

        <FlatList
          testID="semanticList"
          data={[{key: 'Item 1'}, {key: 'Item 2'}]}
          renderItem={({item}) => <Text>{item.key}</Text>}
          style={{height: 40, width: 200, marginBottom: 10, backgroundColor: '#ddd'}}
        />

        <Switch testID="semanticSwitch" style={{marginBottom: 10}} />

        <Slider testID="semanticSlider" style={{width: 200, marginBottom: 10}} minimumValue={0} maximumValue={1} />

        <Picker testID="semanticPicker" style={{width: 200, height: 50}}>
          <Picker.Item label="Option 1" value="1" />
          <Picker.Item label="Option 2" value="2" />
        </Picker>

        <View testID='Grandfather883' style={{padding: 8, backgroundColor: 'red', marginBottom: 10}} accessible={true}>
          <View testID='Father883' style={{padding: 8, backgroundColor: 'green'}} accessible={true}>
            <View testID='Son883' style={{padding: 8, backgroundColor: 'blue'}} accessible={true}>
              <View testID='Grandson883' style={{padding: 8, backgroundColor: 'purple'}} accessible={true} />
            </View>
          </View>
        </View>

        <View style={{flexDirection: 'row', marginBottom: 20}}>
          <Text testID='ProductId000' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId001' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId002' style={{margin: 10}}>Product</Text>
          <Text testID='ProductId003' style={{margin: 10}}>Product</Text>
        </View>

        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'First button pressed')}>
          <Text style={{color: 'brown', marginBottom: 20}}>Index</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Second button pressed')}>
          <Text style={{color: 'brown', marginBottom: 20}}>Index</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={this.onButtonPress.bind(this, 'Third button pressed')}>
          <Text style={{color: 'brown', marginBottom: 20}}>Index</Text>
        </TouchableOpacity>

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
