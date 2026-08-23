import type { Peer } from '@detox-remote/core';
import type { DetoxClientPeer as IDetoxClientPeer, ServerInfoNotification } from '@detox-remote/protocol';
import { SERVER_INFO_METHOD } from '@detox-remote/protocol';
import type {
  AllocateDeviceRequest,
  AllocateDeviceResponse,
  BootDeviceRequest,
  BootDeviceResponse,
  DeviceStateChangedNotification,
  ReleaseDeviceRequest,
  ReleaseDeviceResponse,
  ShutdownDeviceRequest,
  ShutdownDeviceResponse,
  InstallAppParams,
  UninstallAppParams,
  LaunchAppParams,
  LaunchAppResult,
  SetPermissionsParams,
  TerminateAppParams,
  SendToHomeParams,
  OpenURLParams,
  SetLocationParams,
  ResetContentAndSettingsParams,
  ClearKeychainParams,
  TakeScreenshotParams,
  TakeScreenshotResult,
  ReverseTcpPortParams,
  UnreverseTcpPortParams,
} from '@detox-remote/protocol';
import type {
  InvokeParams,
  InvokeResult,
  ReloadReactNativeParams,
  WaitForBackgroundParams,
  WaitForActiveParams,
  ForegroundAppParams,
  ShakeParams,
  SetOrientationParams,
  DeliverPayloadParams,
  SetSyncSettingsParams,
  CurrentStatusParams,
  CurrentStatusResult,
  CaptureViewHierarchyParams,
  CaptureViewHierarchyResult,
  GenerateViewHierarchyXmlParams,
  GenerateViewHierarchyXmlResult,
} from '@detox-remote/protocol';
import type {
  SetBiometricEnrollmentParams,
  MatchFaceParams,
  UnmatchFaceParams,
  MatchFingerParams,
  UnmatchFingerParams,
  SetStatusBarParams,
  ResetStatusBarParams,
} from '@detox-remote/protocol';

export interface DetoxClientPeerDeps {
  peer: Peer;
}

class DetoxClientPeerBase {
  protected _peer: Peer;
  constructor(deps: DetoxClientPeerDeps) {
    this._peer = deps.peer;
  }
}

export class DetoxClientPeer extends DetoxClientPeerBase implements IDetoxClientPeer {
  allocateDevice = this._peer.createMethod<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice');
  bootDevice = this._peer.createMethod<BootDeviceRequest, BootDeviceResponse>('bootDevice');
  shutdownDevice = this._peer.createMethod<ShutdownDeviceRequest, ShutdownDeviceResponse>('shutdownDevice');
  releaseDevice = this._peer.createMethod<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice');
  onDeviceStateChanged = this._peer.createNotificationHandler<DeviceStateChangedNotification>('deviceStateChanged');
  onServerInfo = this._peer.createNotificationHandler<ServerInfoNotification>(SERVER_INFO_METHOD);
  installApp = this._peer.createMethod<InstallAppParams, void>('installApp');
  uninstallApp = this._peer.createMethod<UninstallAppParams, void>('uninstallApp');
  launchApp = this._peer.createMethod<LaunchAppParams, LaunchAppResult>('launchApp');
  terminateApp = this._peer.createMethod<TerminateAppParams, void>('terminateApp');
  setPermissions = this._peer.createMethod<SetPermissionsParams, void>('setPermissions');
  sendToHome = this._peer.createMethod<SendToHomeParams, void>('sendToHome');
  openURL = this._peer.createMethod<OpenURLParams, void>('openURL');
  setLocation = this._peer.createMethod<SetLocationParams, void>('setLocation');
  clearKeychain = this._peer.createMethod<ClearKeychainParams, void>('clearKeychain');
  resetContentAndSettings = this._peer.createMethod<ResetContentAndSettingsParams, void>('resetContentAndSettings');
  takeScreenshot = this._peer.createMethod<TakeScreenshotParams, TakeScreenshotResult>('takeScreenshot');
  reverseTcpPort = this._peer.createMethod<ReverseTcpPortParams, void>('reverseTcpPort');
  unreverseTcpPort = this._peer.createMethod<UnreverseTcpPortParams, void>('unreverseTcpPort');
  setBiometricEnrollment = this._peer.createMethod<SetBiometricEnrollmentParams, void>('setBiometricEnrollment');
  matchFace = this._peer.createMethod<MatchFaceParams, void>('matchFace');
  unmatchFace = this._peer.createMethod<UnmatchFaceParams, void>('unmatchFace');
  matchFinger = this._peer.createMethod<MatchFingerParams, void>('matchFinger');
  unmatchFinger = this._peer.createMethod<UnmatchFingerParams, void>('unmatchFinger');
  setStatusBar = this._peer.createMethod<SetStatusBarParams, void>('setStatusBar');
  resetStatusBar = this._peer.createMethod<ResetStatusBarParams, void>('resetStatusBar');
  invoke = this._peer.createMethod<InvokeParams, InvokeResult>('invoke');
  reloadReactNative = this._peer.createMethod<ReloadReactNativeParams, void>('reloadReactNative');
  waitForBackground = this._peer.createMethod<WaitForBackgroundParams, void>('waitForBackground');
  waitForActive = this._peer.createMethod<WaitForActiveParams, void>('waitForActive');
  foregroundApp = this._peer.createMethod<ForegroundAppParams, void>('foregroundApp');
  shake = this._peer.createMethod<ShakeParams, void>('shake');
  setOrientation = this._peer.createMethod<SetOrientationParams, void>('setOrientation');
  deliverPayload = this._peer.createMethod<DeliverPayloadParams, void>('deliverPayload');
  setSyncSettings = this._peer.createMethod<SetSyncSettingsParams, void>('setSyncSettings');
  currentStatus = this._peer.createMethod<CurrentStatusParams, CurrentStatusResult>('currentStatus');
  captureViewHierarchy = this._peer.createMethod<CaptureViewHierarchyParams, CaptureViewHierarchyResult>('captureViewHierarchy');
  generateViewHierarchyXml = this._peer.createMethod<GenerateViewHierarchyXmlParams, GenerateViewHierarchyXmlResult>('generateViewHierarchyXml');
}
