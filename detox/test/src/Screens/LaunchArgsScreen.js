import React, { Component } from 'react';
import {
  Text,
  View,
} from 'react-native';

export default class SanityScreen extends Component {

  constructor(props) {
    super(props);
    this.state = {
      args: this._parseLaunchArgs(props.launchArgs)
    }
    console.log('LaunchArgsScreen react component constructed (console.log test)');
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <Text style={{fontSize: 25, marginBottom: 30}}>
          Launch Arguments
        </Text>
        {
          this.props.launchArgs
          ? Object.keys(this.state.args).map(arg => <Text>{`-${arg} ${this.state.args[arg]}`}</Text>)
          : <Text>No launch arguments passed</Text>
        }
      </View>
    );
  }

  _parseLaunchArgs(args) {
    if (typeof args !== 'string') {
      return {};
    }

    const argsArray = args.match(/'[^']*'|"[^"]*"|\S+/g) || [];
    let currentKey = 'default';
    const argsObject = {};

    argsArray.forEach(arg => {
      if (arg.match(/^-/)) {
        currentKey = arg.match(/^-+(.*)/)[1];
        argsObject[currentKey] = true;
      } else if (argsObject[currentKey] === true) {
        argsObject[currentKey] = arg;
      } else if (Array.isArray(argsObject[currentKey])) {
        argsObject[currentKey] = [...argsObject[currentKey], arg];
      } else {
        argsObject[currentKey] = [argsObject[currentKey], arg];
      }
    })

    return argsObject;
  }


}
