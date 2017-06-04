import React, { Component } from 'react';
import {
  Text,
  View,
  Animated,
  Button
} from 'react-native';
import _ from 'lodash';

class AnimationStartingRightAway extends Component {
  constructor(props) {
    super(props);

    this._faidInValue = new Animated.Value(0);

    this.state = {
      renderTestedText: false
    };
  }

  componentDidMount() {
    Animated.timing(this._faidInValue, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start(() => this.setState({renderTestedText: true}));
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Animated.Text testID='UniqueId_AnimationsScreen_animatedText' style={{
            marginBottom: 20,
            opacity: this._faidInValue,
            backgroundColor: 'green'
          }}
        >
          Fading in text
        </Animated.Text>
        {(() => { if(this.state.renderTestedText) return (
          <Text testID='UniqueId_AnimationsScreen_testedText' style={{marginBottom: 20}}>
            Tested text
          </Text>
        )})()}
      </View>
    );
  }
}

export default class AnimationsScreen extends Component {
  constructor(props) {
    super(props);

    this.testCases = [
      AnimationStartingRightAway
    ];

    this.state = {
      selectedDriver: undefined,
      currentTestComponent: undefined
    };
  }

  _renderDriverSelection() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        {
          _.map(['js', 'native'], (driver) => {
            return (
              <Button
                key={driver}
                testID={driver}
                title={driver}
                onPress={() => this.setState({selectedDriver: driver})}
              />
            );
          })
        }
      </View>
    );
  }

  render() {
    if(!this.state.selectedDriver) {
      return this._renderDriverSelection();
    }

    if(this.state.currentTestComponent) {
      return React.createElement(this.state.currentTestComponent, {});
    }

    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        {
          _.map(this.testCases, (testClass) => {
            let testClassName = testClass.name;
            return (
              <Button
                key={testClassName}
                testID={testClassName}
                title={testClassName}
                onPress={() => this.setState({currentTestComponent: testClass})}
              />
            );
          })
        }
      </View>
    );
  }
}
