/* eslint-disable node/no-unsupported-features/es-syntax, import/namespace, node/no-unpublished-import */
import { DeviceEventEmitter, NativeAppEventEmitter, Platform } from 'react-native';

import { BackdoorEmitter } from './BackdoorEmitter';

export const detoxBackdoor = new BackdoorEmitter(
  Platform.OS === 'ios'
    ? NativeAppEventEmitter
    : DeviceEventEmitter
);
