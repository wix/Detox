import React, {Component} from 'react';
import {
  View,
  Text,
} from 'react-native';

import {checkMultiple, request, PERMISSIONS, RESULTS} from 'react-native-permissions';

const PERMISSIONS_TO_CHECK = [
  { name: 'userTracking', key: PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY },
  { name: 'calendar', key: PERMISSIONS.IOS.CALENDARS },
  { name: 'camera', key: PERMISSIONS.IOS.CAMERA },
  { name: 'contacts', key: PERMISSIONS.IOS.CONTACTS },
  { name: 'faceid', key: PERMISSIONS.IOS.FACE_ID },
  { name: 'location_always', key: PERMISSIONS.IOS.LOCATION_ALWAYS },
  { name: 'location_when_in_use', key: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE },
  { name: 'medialibrary', key: PERMISSIONS.IOS.MEDIA_LIBRARY },
  { name: 'microphone', key: PERMISSIONS.IOS.MICROPHONE },
  { name: 'motion', key: PERMISSIONS.IOS.MOTION },
  { name: 'photo_library', key: PERMISSIONS.IOS.PHOTO_LIBRARY },
  { name: 'photo_library_add_only', key: PERMISSIONS.IOS.PHOTO_LIBRARY_ADD_ONLY },
  { name: 'reminders', key: PERMISSIONS.IOS.REMINDERS },
  { name: 'siri', key: PERMISSIONS.IOS.SIRI },
  { name: 'speech', key: PERMISSIONS.IOS.SPEECH_RECOGNITION },
];

export default class Permissions extends Component {
  constructor(props) {
    super(props);

    this.state = {
      statuses: {},
    };
  }

  async getStatuses() {
    const toCheck = PERMISSIONS_TO_CHECK.map((permission) => permission.key);
    const statuses = await checkMultiple(toCheck);

    this.setState({
      statuses: statuses,
    });
  }

  async requestPermission(permissionKey) {
    const status = await request(permissionKey);

    this.setState({
      statuses: {
        ...this.state.statuses,
        [permissionKey]: status,
      },
    });
  }

  render() {
    // Table of permissions (name and value)
    return (
      <View onLayout={this.getStatuses.bind(this)}
            style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
        <View style={{flexDirection: 'row'}}>
          <Text style={{fontSize: 20, marginBottom: 20}}>Permissions</Text>
        </View>
        {PERMISSIONS_TO_CHECK.map(({name, key}) => {
          const status = this.state.statuses[key];
          const statusColor = status === RESULTS.GRANTED ? 'green' : status === RESULTS.BLOCKED ? 'red' : 'black';

          return (
            <View style={{flexDirection: 'row'}} key={name}>
              <Text style={{marginBottom: 10, fontSize: 14, marginRight: 20}}>{name}</Text>
              <Text style={{marginBottom: 10, fontSize: 14, marginRight: 20, color: statusColor}} testID={name}>
                {status}
              </Text>
              <Text
                style={{marginBottom: 10, fontSize: 14, color: 'blue', textDecorationLine: 'underline'}}
                onPress={() => this.requestPermission(key)}>
                ask
              </Text>
            </View>
          );
        })}
      </View>
    );
  }
}
