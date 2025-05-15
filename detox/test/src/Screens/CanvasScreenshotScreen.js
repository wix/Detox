import React, { Component } from 'react';
import { View, Dimensions, TouchableHighlight } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

class ArtisticRectangle extends Component {
  static defaultProps = {
    borderSizeV: 12,
    borderSizeH: 12
  };

  // there are two skia canvas on purpose to see if the screenshot mechanism 
  // can handle multiple on different levels
  render() {
    const paddingHorizontal = this.props.borderSizeH;
    const paddingVertical = this.props.borderSizeV;
    return (
      <View testID={this.props.testID} accessible={true}>
        <View style={{ paddingHorizontal, paddingVertical, backgroundColor: 'cyan' }}>
          <View style={{ paddingHorizontal, paddingVertical, backgroundColor: 'magenta' }}>
            <View style={{ paddingHorizontal, paddingVertical, backgroundColor: 'yellow' }}>
              <Canvas style={{ paddingHorizontal, paddingVertical }}>
                <Rect x={0} y={0} width={10} height={10} color={'black'} />
              </Canvas>
            </View>
            <Canvas style={{ paddingHorizontal, paddingVertical }}>
              <Rect x={10} y={10} width={10} height={10} color={'black'} />
            </Canvas>
          </View>
        </View>
      </View>
    );
  }
}

export default class CanvasScreenshotScreen extends Component {
  static orientations = {
    vertical: {
      borderSizeH: 12,
      borderSizeV: (screenHeight * 0.9) / 8
    },
    horizontal: {
      borderSizeH: (screenWidth * 0.9) / 8,
      borderSizeV: 12
    }
  };

  constructor(props) {
    super(props);
    this.switchOrientation = this.switchOrientation.bind(this);

    this.state = {
      orientation: 'vertical'
    };
  }

  render() {
    const { borderSizeH, borderSizeV } = CanvasScreenshotScreen.orientations[this.state.orientation];

    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <TouchableHighlight testID="switchOrientation" onPress={this.switchOrientation}>
          <ArtisticRectangle testID="fancyElement" borderSizeH={borderSizeH} borderSizeV={borderSizeV} />
        </TouchableHighlight>
      </View>
    );
  }

  switchOrientation() {
    this.setState({
      orientation: this.state.orientation === 'vertical' ? 'horizontal' : 'vertical'
    });
  }
}
