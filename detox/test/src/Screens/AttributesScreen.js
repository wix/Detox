import React, { Component } from 'react';
import {
  BackHandler,
  Platform,
  Text,
  View
} from 'react-native';

const isIos = Platform.OS === 'ios';
const isAndroid = Platform.OS === 'android';

export default class AttributesScreen extends Component {
  constructor(props) {
    super(props);
    this.state = {
      backPressed: false,
    }
  }

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.backHandler.bind(this));
  }

  render() {
    if (this.state.backPressed) return this.renderPopupBackPressedDetected();

    return (
      <View>
        <View
          testID={'viewId'}
          width={100}
          height={100}
          />
        <Text
          testID={'textViewId'}
        >TextView</Text>
      </View>
    );
  }

  renderPopupBackPressedDetected() {
    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 25 }}>
          Back pressed !
        </Text>
      </View>
    );
  }

  backHandler() {
    this.setState({
      backPressed: true
    });
    return true;
  };
}
