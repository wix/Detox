import React, {Component} from 'react';
import {
  View,
  Text,
  NativeModules
} from 'react-native';

const CalendarManager = NativeModules.CalendarManager;

const CALENDAR_AUTH_STATUS_TEST_ID = 'calendar_authorization_status';

export default class Permissions extends Component {

  constructor(props) {
    super(props);
    this.state = {
      calendarAuthStatus: undefined,
    };
  }

  async getCalendarAuthStatus() {
    const calendarAuthStatus = await CalendarManager.getAuthorizationStatus();

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
          <Text testID={CALENDAR_AUTH_STATUS_TEST_ID}
                style={{marginBottom: 20}}>{this.state.calendarAuthStatus}</Text>
        </View>
      </View>
    );
  }
}
