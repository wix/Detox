import React from 'react';
import {
  NativeModules,
} from 'react-native';
import AbstractArgsListScreen from './AbstractArgsListScreen';

const { NativeModule } = NativeModules;

export default class LaunchNotificationScreen extends AbstractArgsListScreen {
  constructor(props) {
    super(props, 'notificationData');
  }

  async readArguments() {
    return await NativeModule.parseNotificationData(null);
  }

  getTitle() {
    return 'Launch-notification Data';
  }
}
