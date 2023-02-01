import React, {Component} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Platform,
    StyleSheet,
} from 'react-native';
import SegmentedControlIOS from '@react-native-segmented-control/segmented-control';

const accentColor = '#007AFF';
const styles = StyleSheet.create({
  container: { flexDirection: 'row', borderWidth: 1, borderColor: accentColor, borderRadius: 5, height: 32 },
  segmentContainer: { flex: 1 },
  segmentBase: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

class SegmentedControlAndroid extends Component {
  static selectedColor = '#007AFF';
    constructor(props) {
      super(props);
      this.state = {
        values: this.props.values || [],
        selectedIndex: this.props.selectedIndex || 0,
        style: this.props.style,
        onValueChange: this.props.onValueChange
      };
      this.renderSegment = this.renderSegment.bind(this);
    }

    onPress(selectedIndex) {
      if (typeof this.state.onValueChange === 'function') {
        this.state.selectedIndex = selectedIndex;
        return this.state.onValueChange(this.props.values[selectedIndex]);
      }
    }

    render() {
        return (
            <View testID={this.props.testID} style={[styles .container, this.state.style ]}>
                { this.state.values.map(this.renderSegment) }
            </View>
        );
    }

    renderSegment(text, index, values) {
      return (
        <TouchableOpacity key={index} onPress={()=>this.onPress(index)} style={ styles.segmentContainer }>
          <View style={[ styles.segmentBase, {
            backgroundColor: this.state.selectedIndex === index ? accentColor : 'transparent',
            borderRightWidth: index < values.length - 1 ? 1 : 0, borderRightColor: accentColor }]
          }>
            <Text style={{fontSize: 13, color: this.state.selectedIndex === index ? 'white' : accentColor}}>
              {text}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }
}

let SegmentedControl = Platform.OS === 'ios' ? SegmentedControlIOS : SegmentedControlAndroid;
export default SegmentedControl;
