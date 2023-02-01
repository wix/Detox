import React, { Component } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  NativeModules
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import getStringByLength from '../helpers/buffers';
import * as storageHelper from '../helpers/storage';

const { NativeModule } = NativeModules;

const BRIDGE_ONEWAY_CALLS = 400;
const BRIDGE_ONEWAY_STR_CHUNK_LEN = 1000;
const BRIDGE_TWOWAY_CALLS = 400;
const BRIDGE_TWOWAY_STR_CHUNK_LEN = 1000;
const BRIDGE_SETSTATE_STR_CHUNK_LEN = 1000;
const EVENT_LOOP_COUNT = 5000;
const EVENT_LOOP_STR_CHUNK_LEN = 1000;

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
        {this.renderTestButton('Storage Stress', this.storageStressButtonPressed.bind(this))}
        {this.renderTestButton('VirtualizedList Stress', this.virtualizedListStressPressed.bind(this))}
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

  async storageStressButtonPressed() {
    try {
      await NativeModule.toggleNonStorageSynchronization(false);
      await AsyncStorage.clear();
      await storageHelper.runStressTest();
    } finally {
      await NativeModule.toggleNonStorageSynchronization(true);
      await AsyncStorage.clear();
    }

    this.setState({
      phase2: 'StorageStress'
    });
  }

  async virtualizedListStressPressed() {
    this.props.setScreen('VirtualizedListStressScreen');
  }
}
