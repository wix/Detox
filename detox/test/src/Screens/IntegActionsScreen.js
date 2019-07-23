import React, { Component } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

class SelfCountingText extends Component {
  constructor(props) {
    super(props);

    this.state = {
      taps: 0,
    };
    this.onTap = this.onTap.bind(this);
  }

  render() {
    return (
      <TouchableOpacity {...this.props} testID={''} onPress={this.onTap}>
        <Text testID={this.props.testID} style={{ textAlign: 'center', textAlignVertical: 'center' }}>{this.props.name}: {this.state.taps}</Text>
      </TouchableOpacity>
    )
  }

  onTap() {
    this.setState({
      taps: this.state.taps + 1,
    });
  }
}

export default class IntegActionsScreen extends Component {

  render() {
    return (
      <View testID='integActions.root' style={{ flex: 1, paddingTop: 40, justifyContent: 'center' }}>

        <View style={{ height: 40, backgroundColor: 'lightblue' }}>
          <ScrollView testID='integActions.textsScrollView'>
            {
              this.renderAllTappableTexts(10)
            }
          </ScrollView>
        </View>

        <View style={{ height: 40, backgroundColor: 'lightblue', marginTop: 40 }}>
          <ScrollView testID='integActions.inputsScrollView'>
            {
              this.renderAllTextInputs(10)
            }
          </ScrollView>
        </View>

      </View>
    );
  }

  renderAllTappableTexts(length) {
    return Array.from({length}, (_, index) => {
      const marginBottom = 20 * (index + 1);
      return this.renderTappableText(index + 1, marginBottom)
    })
  }

  renderTappableText(index, marginBottom) {
    const key = `tappableText-${index}`;
    return <SelfCountingText
      key={key}
      testID={key}
      name={key}
      style={{ height: 40, marginBottom }}
    />
  }

  renderAllTextInputs(length) {
    return Array.from({length}, (_, index) => {
      const marginBottom = 20 * (index + 1);
      return this.renderTextInput(index + 1, marginBottom)
    })
  }

  renderTextInput(index, marginBottom) {
    const key = `textInput-${index}`;
    return <TextInput
      key={key}
      testID={key}
      placeholder={key}
      style={{ height: 40, backgroundColor: 'white', marginBottom, marginHorizontal: 20, padding: 5 }}
    />
  }
}
