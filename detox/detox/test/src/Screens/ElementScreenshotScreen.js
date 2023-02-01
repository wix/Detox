import React, { Component } from 'react';
import { View, Dimensions, TouchableHighlight } from 'react-native';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

class ArtisticRectangle extends Component {
  static defaultProps = {
    borderSizeV: 12,
    borderSizeH: 12,
  }

  render() {
    const paddingHorizontal = this.props.borderSizeH;
    const paddingVertical = this.props.borderSizeV;
    return (
      <View testID={this.props.testID}>
        <View style={{paddingHorizontal, paddingVertical, backgroundColor: 'cyan'}}>
          <View style={{paddingHorizontal, paddingVertical, backgroundColor: 'magenta'}}>
            <View style={{paddingHorizontal, paddingVertical, backgroundColor: 'yellow'}}>
              <View style={{paddingHorizontal, paddingVertical, backgroundColor: 'black'}} />
            </View>
          </View>
        </View>
      </View>
    );
  }
}

export default class ElementScreenshotScreen extends Component {
  static orientations = {
    'vertical': {
      borderSizeH: 12,
      borderSizeV: screenHeight * 0.9 / 8,
    },
    'horizontal': {
      borderSizeH: screenWidth * 0.9 / 8,
      borderSizeV: 12,
    }
  };

  constructor(props) {
    super(props);
    this.switchOrientation = this.switchOrientation.bind(this);

    this.state = {
      orientation: 'vertical',
    };
  }

  render() {
    const { borderSizeH, borderSizeV } = ElementScreenshotScreen.orientations[this.state.orientation];

    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableHighlight testID='switchOrientation' onPress={this.switchOrientation}>
          <ArtisticRectangle testID='fancyElement' borderSizeH={borderSizeH} borderSizeV={borderSizeV} />
        </TouchableHighlight>
      </View>
    );
  }

  switchOrientation() {
    this.setState({
      orientation: this.state.orientation === 'vertical' ? 'horizontal' : 'vertical',
    });
  }
}
