import React, {Component} from 'react';
import {
  View,
  Text, Button,
} from 'react-native';

import {request, PERMISSIONS, RESULTS, check} from 'react-native-permissions';

export default class SystemDialogsScreen extends Component {
  constructor(props) {
    super(props);

    this.state = {
      userTrackingStatus: RESULTS.UNAVAILABLE,
    };
  }

  async updateStatus() {
    const status = await check(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);

    this.setState({
      userTrackingStatus: status,
    });
  }

  async requestPermission() {
    const status = await request(PERMISSIONS.IOS.APP_TRACKING_TRANSPARENCY);

    this.setState({
      userTrackingStatus: status,
    });
  }

  render() {
    const status = this.state.userTrackingStatus;

    return (
      <View onLayout={this.updateStatus.bind(this)}
            style={{flex: 1, paddingTop: 20, justifyContent: 'center', alignItems: 'center'}}>
          <Text style={{marginBottom: 10, fontSize: 20}}>User Tracking Status</Text>
          <Text style={{marginBottom: 10}} testID={'permissionStatus'}>{status}</Text>
          <Button title={'Request Permission'} testID={'requestPermissionButton'} onPress={this.requestPermission.bind(this)}/>
      </View>
    );
  }
}
