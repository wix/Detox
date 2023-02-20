import React, {Component} from 'react';
import {
  Text,
  View,
  ScrollView,
  Animated,
  TouchableOpacity,
  TextInput
} from 'react-native';

export default class WaitForScreen extends Component {
  constructor(props) {
    super(props);
    this.textInputRef = React.createRef();
    this.state = {
      toggle: false,
      becomeVisibleLeft: new Animated.Value(-500)
    };
  }

  componentDidUpdate(prevProps, prevState, _) {
    if (prevState.toggle === this.state.toggle) {
      return;
    }

    if (this.state.toggle) {
      this.textInputRef.current.focus();
    } else {
      this.textInputRef.current.blur();
    }
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 40, justifyContent: 'flex-start'}}>

        <View style={{height: 100, borderColor: '#c0c0c0', borderWidth: 1, backgroundColor: '#f8f8ff', marginBottom: 20}}>
          <ScrollView testID='ScrollView'>
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

        {!this.state.toggle ? false :
          <Text testID='changeExistenceByToggle' style={{marginBottom: 20, textAlign: 'center', color: 'red'}}>
            I am being exist / removed 2 sec after click
          </Text>
        }

        <TextInput
          testID='changeFocusByToggle'
          style={{marginBottom: 20}}
          value='I am focused / unfocused 2 sec after click'
          ref={this.textInputRef}
        />

        <TouchableOpacity onPress={this.onGoButtonPress.bind(this)}>
          <Text testID='goButton' style={{color: 'blue', textAlign: 'center'}}>Go</Text>
        </TouchableOpacity>

      </View>
    );
  }

  onGoButtonPress() {
    setTimeout(() => {
      let previousState = this.state.toggle;

      this.setState({
        toggle: !previousState
      });
    }, 2000);
  }
}
