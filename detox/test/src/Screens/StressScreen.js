import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeModules
} from 'react-native';

const NativeModule = NativeModules.NativeModule;

const BRIDGE_ONEWAY_CALLS = 10000;
const BRIDGE_ONEWAY_STR_CHUNK_LEN = 40000;
const BRIDGE_TWOWAY_CALLS = 1000;
const BRIDGE_TWOWAY_STR_CHUNK_LEN = 10000;
const BRIDGE_SETSTATE_STR_CHUNK_LEN = 10000;
const EVENT_LOOP_COUNT = 10000;
const EVENT_LOOP_STR_CHUNK_LEN = 10000;

function getStringByLength(chunks) {
  const buffers = [
    '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'
  ];
  let res = '';
  for (let i = 0; i < chunks ; i++) {
    res += buffers[i % buffers.length];
  }
  return res;
}

export default class StressScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      phase1: undefined,
      phase2: undefined,
      extraData: undefined,
      counter: 1
    };
  }

  renderTestButton(label, onPress) {
    return (
      <TouchableOpacity onPress={onPress}>
        <Text style={{color: 'blue', marginBottom: 20}}>{label}</Text>
      </TouchableOpacity>
    )
  }

  render() {
    if (this.state.phase2) return this.renderPhase2();
    if (this.state.phase1) return this.renderPhase1();
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        {this.renderTestButton('Bridge OneWay Stress', this.bridgeOneWayStressButtonPressed.bind(this))}
        {this.renderTestButton('Bridge TwoWay Stress', this.bridgeTwoWayStressButtonPressed.bind(this))}
        {this.renderTestButton('Bridge setState Stress', this.bridgeSetStateStressButtonPressed.bind(this))}
        {this.renderTestButton('EventLoop Stress', this.eventLoopStressButtonPressed.bind(this))}
        {this.renderTestButton(`Consecutive Stress ${this.state.counter}`, this.consecutiveStressButtonPressed.bind(this))}
      </View>
    );
  }

  renderPhase2() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 20}}>
          {this.state.phase2}
        </Text>
        {
          !this.state.extraData ? false :
          <Text style={{fontSize: 10, width: 100, height: 20}}>
            Extra Data: {this.state.extraData}
          </Text>
        }
      </View>
    );
  }

  renderPhase1() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <TouchableOpacity onPress={this.onButtonPress.bind(this)}>
          <Text style={{color: 'blue', marginBottom: 20}}>Next</Text>
        </TouchableOpacity>
      </View>
    );
  }

  onButtonPress() {
    this.setState({
      phase2: this.state.phase1
    });
  }

  bridgeOneWayStressButtonPressed() {
    this.setState({
      phase1: 'BridgeOneWay'
    });
    setTimeout(() => {
      const str = getStringByLength(BRIDGE_ONEWAY_STR_CHUNK_LEN);
      for (let i = 0 ; i < BRIDGE_ONEWAY_CALLS ; i++) {
        NativeModule.echoWithoutResponse(str);
      }
    }, 1);
  }

  bridgeTwoWayStressButtonPressed() {
    this.setState({
      phase1: 'BridgeTwoWay'
    });
    setTimeout(() => {
      const str = getStringByLength(BRIDGE_TWOWAY_STR_CHUNK_LEN);
      for (let i = 0 ; i < BRIDGE_TWOWAY_CALLS ; i++) {
        NativeModule.echoWithResponse(str);
      }
    }, 1);
  }

  bridgeSetStateStressButtonPressed() {
    this.setState({
      phase1: 'BridgeSetState'
    });
    setTimeout(() => {
      const str = getStringByLength(BRIDGE_SETSTATE_STR_CHUNK_LEN);
      this.setState({
        extraData: str
      });
    }, 1);
  }

  eventLoopStressButtonPressed() {
    this.setState({
      phase1: 'EventLoop'
    });
    for (let i = 0 ; i < EVENT_LOOP_COUNT ; i++) {
      setTimeout(() => {
        let str = getStringByLength(EVENT_LOOP_STR_CHUNK_LEN);
      }, 1);
    }
  }

  consecutiveStressButtonPressed() {
    this.setState({
      counter: this.state.counter + 1
    });
  }

}
