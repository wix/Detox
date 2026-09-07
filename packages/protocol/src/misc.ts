// Biometrics & Status bar - matches Detox device.* API

import type { DeviceActionParams } from './device';

// Biometrics

export interface SetBiometricEnrollmentParams extends DeviceActionParams {
  enabled: boolean;
}

export type MatchFaceParams = DeviceActionParams;

export type UnmatchFaceParams = DeviceActionParams;

export type MatchFingerParams = DeviceActionParams;

export type UnmatchFingerParams = DeviceActionParams;

// Status bar

export interface SetStatusBarParams extends DeviceActionParams {
  time?: string;
  dataNetwork?: 'hide' | 'wifi' | '3g' | '4g' | 'lte' | 'lte-a' | 'lte+' | '5g' | '5g+' | '5g-uwb' | '5g-uc';
  wifiMode?: 'searching' | 'failed' | 'active';
  wifiBars?: 0 | 1 | 2 | 3;
  cellularMode?: 'notSupported' | 'searching' | 'failed' | 'active';
  cellularBars?: 0 | 1 | 2 | 3 | 4;
  operatorName?: string;
  batteryState?: 'charging' | 'charged' | 'discharging';
  batteryLevel?: number;
}

export type ResetStatusBarParams = DeviceActionParams;
