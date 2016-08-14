import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeModules
} from 'react-native';

const NativeModule = NativeModules.NativeModule;

const BRIDGE_ONEWAY_CALLS = 10;
const BRIDGE_ONEWAY_STR_CHUNK_LEN = 20;
const BRIDGE_TWOWAY_CALLS = 10;
const BRIDGE_TWOWAY_STR_CHUNK_LEN = 20;
const BRIDGE_SETSTATE_STR_CHUNK_LEN = 20;
const EVENT_LOOP_COUNT = 10;
const EVENT_LOOP_STR_CHUNK_LEN = 20;

function getStringByLength(chunks) {
  let res = '';
  for (let i = 0; i < chunks ; i++) {
    res += 'EqtCfLH6DYnLT4WjBcLfR9M33uxSEEBMphVSTnpKpEfHCBNn3oxVMpEQ0Rzqlx8BiiyCIF5WnkEhJyGsGhHtVfjgwCueY0DQXmat';
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
    setImmediate(() => {
      const str = getStringByLength(BRIDGE_ONEWAY_STR_CHUNK_LEN);
      for (let i = 0 ; i < BRIDGE_ONEWAY_CALLS ; i++) {
        NativeModule.echoWithoutResponse(str);
      }
    });
  }

  bridgeTwoWayStressButtonPressed() {
    this.setState({
      phase1: 'BridgeTwoWay'
    });
    setImmediate(() => {
      const str = getStringByLength(BRIDGE_TWOWAY_STR_CHUNK_LEN);
      for (let i = 0 ; i < BRIDGE_TWOWAY_CALLS ; i++) {
        NativeModule.echoWithResponse(str);
      }
    });
  }

  bridgeSetStateStressButtonPressed() {
    this.setState({
      phase1: 'BridgeSetState'
    });
    setImmediate(() => {
      const str = getStringByLength(BRIDGE_SETSTATE_STR_CHUNK_LEN);
      this.setState({
        extraData: str
      });
    });
  }

  eventLoopStressButtonPressed() {
    this.setState({
      phase1: 'EventLoop'
    });
    for (let i = 0 ; i < EVENT_LOOP_COUNT ; i++) {
      setImmediate(() => {
        let str = getStringByLength(EVENT_LOOP_STR_CHUNK_LEN);
      });
    }
  }

  consecutiveStressButtonPressed() {
    this.setState({
      counter: this.state.counter + 1
    });
  }

}
