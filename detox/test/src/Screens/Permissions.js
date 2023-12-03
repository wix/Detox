import React, {Component} from 'react';
import {
  View,
  Text,
} from 'react-native';

import {checkMultiple, PERMISSIONS} from 'react-native-permissions';

export default class Permissions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      calendarAuthStatus: undefined,
    };
  }

  async getCalendarAuthStatus() {
    const statuses = await checkMultiple([PERMISSIONS.IOS.CALENDARS]);
    const calendarAuthStatus = statuses[PERMISSIONS.IOS.CALENDARS];

    this.setState({
      calendarAuthStatus: calendarAuthStatus
    });
  }

  render() {
    // Table of permissions (name and value)
    return (
      <View onLayout={this.getCalendarAuthStatus.bind(this)}
            style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{flexDirection: 'row'}}>
          <Text style={{fontSize: 20, marginBottom: 20}}>Permissions</Text>
        </View>

        <View style={{flexDirection: 'row'}}>
          <Text style={{marginBottom: 20}}>Calendar: </Text>
          <Text testID={PERMISSIONS.IOS.CALENDARS}
                style={{marginBottom: 20}}>{this.state.calendarAuthStatus}</Text>
        </View>
      </View>
    );
  }
}
