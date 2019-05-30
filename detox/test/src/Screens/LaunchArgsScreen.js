import _ from 'lodash';
import React, { Component } from 'react';
import {
  Text,
  View,
  NativeModules,
} from 'react-native';

const { NativeModule } = NativeModules;

export default class LaunchArgsScreen extends Component {

  constructor(props) {
    super(props);

    this.state = {
      launchArgs: undefined,
    }
  }

  async componentWillMount() {
    const launchArgs = await NativeModule.getLaunchArguments();
    this.setState({
      launchArgs,
    })
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 30}}>
          Launch Arguments
        </Text>

        {this.state.launchArgs && this.renderLaunchArgsList()}

        <Text style={{paddingTop: 20, fontWeight: 'bold'}}>Arguments count: </Text>
        {this.state.launchArgs && <Text testID="launchArgsCount">{Object.keys(this.state.launchArgs || {}).length}</Text>}
      </View>
    );
  }

  renderLaunchArgsList() {
    return _.reduce(this.state.launchArgs, (result, argValue, argName) => {
      const itemId = `launchArg-${argName}`;
      const nameId = itemId + '.name';
      const valueId = itemId + '.value';
      result.push(
        <Text key={nameId} testID={nameId} style={{fontWeight: 'bold'}}>{argName}:</Text>,
        <Text key={valueId} testID={valueId} style={{paddingBottom: 4}}>{argValue}</Text>,
      );
      return result;
    }, []);
  }
}
