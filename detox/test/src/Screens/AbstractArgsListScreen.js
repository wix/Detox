import _ from 'lodash';
import React, { Component } from 'react';
import {
  Text,
  View,
} from 'react-native';

export default class AbstractArgsListScreen extends Component {

  constructor(props, contextName) {
    super(props);
    this.contextName = contextName;

    this.state = {
      argsList: undefined,
    }
  }

  async componentDidMount() {
    const argsList = await this.readArguments();
    this.setState({
      argsList,
    })
  }

  readArguments() {
    return Promise.reject('Not implemented');
  }

  getTitle() {
    return Promise.reject('Not implemented');
  }

  render() {
    return (
      <View style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        {this.renderTitle()}

        {this.state.argsList && this.renderArgsList()}

        <Text style={{paddingTop: 20, fontWeight: 'bold'}}>Arguments count: </Text>
        {this.state.argsList && <Text testID="argsCount">{Object.keys(this.state.argsList || {}).length}</Text>}
      </View>
    );
  }

  renderTitle() {
    const title = this.getTitle();
    return <Text style={{fontSize: 25, marginBottom: 30}}>{title}</Text>
  }

  renderArgsList() {
    return _.reduce(this.state.argsList, (result, argValue, argName) => {
      const _argValue = (_.isArray(argValue) || _.isObject(argValue) ? JSON.stringify(argValue) : argValue);
      const itemId = `${this.contextName}-${argName}`;
      const nameId = itemId + '.name';
      const valueId = itemId + '.value';
      result.push(
        <Text key={nameId} testID={nameId} style={{fontWeight: 'bold'}}>{argName}:</Text>,
        <Text key={valueId} testID={valueId} style={{paddingBottom: 4}}>{_argValue}</Text>,
      );
      return result;
    }, []);
  }
}
