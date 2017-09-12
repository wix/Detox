import React, {Component} from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SegmentedControlIOS,
    Platform
} from 'react-native';

class SegmentedControlAndroid extends Component {
    constructor(props) {
      super(props);
    
      this.state = {
        values: this.props.values || [],
        selectedIndex: this.props.selectedIndex || 0,
        style: this.props.style || {},
        onValueChange: this.props.onValueChange
      };
    }

    onPress(selectedIndex) {
      if (typeof this.state.onValueChange === 'function') {
        console.log("selectedIndex:", selectedIndex);
        console.log(this.state.values);
        this.state.selectedIndex = selectedIndex;
        return this.state.onValueChange(this.props.values[selectedIndex]);
      }
    }

    render() {
        return (
            <View testID={this.props.testID} style={[{flexDirection: 'row', borderWidth: 1, borderColor: '#007AFF', borderRadius: 5}, this.state.style]}>
                {this.state.values.map(function (value, position, values) {
                    return (
                        <TouchableOpacity key={position} onPress={()=>this.onPress(position)} style={{flex: 1}}>
                            <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16,
                            backgroundColor: this.state.selectedIndex == position ? '#007AFF' : 'transparent',
                            borderRightWidth: position < values.length - 1 ? 1 : 0, borderRightColor: '#007AFF'}}>
                                <Text style={{fontSize: 13, color: this.state.selectedIndex == position ? 'white' : '#007AFF'}}>{value}</Text>
                            </View>
                        </TouchableOpacity>
                    );
                }.bind(this))}
            </View>
        );
    }
}

let SegmentedControl = Platform.OS === 'ios' ? SegmentedControlIOS : SegmentedControlAndroid;
export default SegmentedControl;