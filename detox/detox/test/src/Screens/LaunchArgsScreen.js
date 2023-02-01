import React from 'react';
import {
  NativeModules,
} from 'react-native';
import AbstractArgsListScreen from './AbstractArgsListScreen';

const { NativeModule } = NativeModules;

export default class LaunchArgsScreen extends AbstractArgsListScreen {
  constructor(props) {
    super(props, 'launchArg');
  }

  async readArguments() {
    return await NativeModule.getLaunchArguments();
  }

  getTitle() {
    return 'Launch Arguments';
  }
}
