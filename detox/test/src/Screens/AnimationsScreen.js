import React, { Component } from 'react';
import {
  Text,
  View,
  Animated,
  Button,
  Platform
  Switch,
  TextInput
} from 'react-native';
import SegmentedControl from '../Views/SegmentedControl.js';
import _ from 'lodash';


class AnimationsComponent extends Component {
  constructor(props) {
    super(props);

    this._faidInValue = new Animated.Value(0);

    this.state = {
      showAfterAnimationText: false
    };
  }

  componentDidMount() {
    let fadeInAnimation = Animated.timing(this._faidInValue, {
      toValue: 1,
      duration: this.props.duration,
      delay: this.props.delay,
      useNativeDriver: this.props.useNativeDriver
    });
    var animation;
    if(this.props.loops === undefined) {
      animation = fadeInAnimation;
    } else {
      animation = Animated.loop(
        Animated.sequence([
          fadeInAnimation,
          Animated.timing(this._faidInValue, {
            toValue: 0.5,
            duration: 0,
            useNativeDriver: this.props.useNativeDriver
          })
        ]),
        {
          iterations: this.props.loops
        }
      );
    }
    
    animation.start(() => this.setState({ showAfterAnimationText: true }));
  }

  render() {
    return (
      <View style={{ flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center' }}>
        <Animated.Text testID='UniqueId_AnimationsScreen_animatedText' style={{
          opacity: this._faidInValue,
          backgroundColor: 'green'
        }}
        >
          Fading in text
        </Animated.Text>
        {(() => {
          if (this.state.showAfterAnimationText) return (
            <Text testID='UniqueId_AnimationsScreen_afterAnimationText' style={{ marginTop: 20 }}>
              After-animation-text
          </Text>
          )
        })()}
      </View>
    );
  }
}


export default class AnimationsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      useNativeDriver: undefined,
      enableLoop: false,
      numberOfIterations: -1,
      duration: 400,
      delay: 0,
      testStarted: false
    };
  }

  render() {
    if (this.state.testStarted) {
      return (
        <AnimationsComponent
          useNativeDriver={this.state.useNativeDriver}
          loops={this.state.enableLoop ? this.state.numberOfIterations : undefined}
          duration={this.state.duration}
          delay={this.state.delay}
        />
      );
    }

    let numOfIterationsColor = this.state.enableLoop ? 'black' : 'grey';
    return (
      <View style={{ flex: 1, paddingTop: 20, paddingLeft: 20, paddingRight: 20, justifyContent: 'center', alignItems: 'stretch' }}>
        <View>
          <Text>Driver:</Text>
          <SegmentedControl
            testID="UniqueId_AnimationsScreen_useNativeDriver"
            values={['JS', 'Native']}
            selectedIndex={-1}
            onValueChange={(value) => this.setState({ useNativeDriver: value === 'Native' })}
          />
        </View>
        <View style={{paddingTop: 20}}>
          <Text>Loop:</Text>
          <Switch
            testID="UniqueId_AnimationsScreen_enableLoop"
            value={this.state.enableLoop}
            onValueChange={(value) => this.setState({enableLoop: value})}
          />
          <Text style={{color: numOfIterationsColor}}>Number of iterations:</Text>
          <TextInput style={{color: numOfIterationsColor, height: Platform.OS == 'android' ? 40 : 20}}
            testID="UniqueId_AnimationsScreen_numberOfIterations"
            editable={this.state.enableLoop}
            onChangeText={(value) => this.setState({numberOfIterations: Number(value)})}
            placeholder={String(this.state.numberOfIterations)}
          />
        </View>
        <View style={{paddingTop: 20}}>
          <Text>Duration:</Text>
          <TextInput style={{height: Platform.OS == 'android' ? 40 : 20}}
            testID="UniqueId_AnimationsScreen_duration"
            onChangeText={(value) => this.setState({duration: Number(value)})}
            placeholder={String(this.state.duration)}
          />
        </View>
        <View style={{paddingTop: 20}}>
          <Text>Delay:</Text>
          <TextInput style={{height: Platform.OS == 'android' ? 40 : 20}}
            testID="UniqueId_AnimationsScreen_delay"
            onChangeText={(value) => this.setState({delay: Number(value)})}
            placeholder={String(this.state.delay)}
          />
        </View>
        <Button
          style={{paddingTop: 20}}
          title="Start"
          testID="UniqueId_AnimationsScreen_startButton"
          disabled={this.state.useNativeDriver === undefined}
          onPress={() => this.setState({ testStarted: true })}
        />
      </View>
    );
  }
}
