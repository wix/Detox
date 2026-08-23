import type { Peer } from '@detox-remote/core';
import type { DetoxServerPeer as IDetoxServerPeer, ServerInfoNotification } from '@detox-remote/protocol';
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

export interface DetoxServerPeerDeps {
  peer: Peer;
}

/** Holds the Peer so the subclass field initializers see _peer after base ctor runs. */
class DetoxServerPeerBase {
  protected _peer: Peer;
  constructor(deps: DetoxServerPeerDeps) {
    this._peer = deps.peer;
  }
}

export class DetoxServerPeer extends DetoxServerPeerBase implements IDetoxServerPeer {
  onAllocateDevice = this._peer.createMethodHandler<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice');
  onBootDevice = this._peer.createMethodHandler<BootDeviceRequest, BootDeviceResponse>('bootDevice');
  onShutdownDevice = this._peer.createMethodHandler<ShutdownDeviceRequest, ShutdownDeviceResponse>('shutdownDevice');
  onReleaseDevice = this._peer.createMethodHandler<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice');
  notifyDeviceStateChanged = this._peer.createNotification<DeviceStateChangedNotification>('deviceStateChanged');
  notifyServerInfo = this._peer.createNotification<ServerInfoNotification>(SERVER_INFO_METHOD);
  onInstallApp = this._peer.createMethodHandler<InstallAppParams, void>('installApp');
  onUninstallApp = this._peer.createMethodHandler<UninstallAppParams, void>('uninstallApp');
  onLaunchApp = this._peer.createMethodHandler<LaunchAppParams, LaunchAppResult>('launchApp');
  onTerminateApp = this._peer.createMethodHandler<TerminateAppParams, void>('terminateApp');
  onSetPermissions = this._peer.createMethodHandler<SetPermissionsParams, void>('setPermissions');
  onSendToHome = this._peer.createMethodHandler<SendToHomeParams, void>('sendToHome');
  onOpenURL = this._peer.createMethodHandler<OpenURLParams, void>('openURL');
  onSetLocation = this._peer.createMethodHandler<SetLocationParams, void>('setLocation');
  onClearKeychain = this._peer.createMethodHandler<ClearKeychainParams, void>('clearKeychain');
  onResetContentAndSettings = this._peer.createMethodHandler<ResetContentAndSettingsParams, void>('resetContentAndSettings');
  onTakeScreenshot = this._peer.createMethodHandler<TakeScreenshotParams, TakeScreenshotResult>('takeScreenshot');
  onReverseTcpPort = this._peer.createMethodHandler<ReverseTcpPortParams, void>('reverseTcpPort');
  onUnreverseTcpPort = this._peer.createMethodHandler<UnreverseTcpPortParams, void>('unreverseTcpPort');
  onSetBiometricEnrollment = this._peer.createMethodHandler<SetBiometricEnrollmentParams, void>('setBiometricEnrollment');
  onMatchFace = this._peer.createMethodHandler<MatchFaceParams, void>('matchFace');
  onUnmatchFace = this._peer.createMethodHandler<UnmatchFaceParams, void>('unmatchFace');
  onMatchFinger = this._peer.createMethodHandler<MatchFingerParams, void>('matchFinger');
  onUnmatchFinger = this._peer.createMethodHandler<UnmatchFingerParams, void>('unmatchFinger');
  onSetStatusBar = this._peer.createMethodHandler<SetStatusBarParams, void>('setStatusBar');
  onResetStatusBar = this._peer.createMethodHandler<ResetStatusBarParams, void>('resetStatusBar');
  onInvoke = this._peer.createMethodHandler<InvokeParams, InvokeResult>('invoke');
  onReloadReactNative = this._peer.createMethodHandler<ReloadReactNativeParams, void>('reloadReactNative');
  onWaitForBackground = this._peer.createMethodHandler<WaitForBackgroundParams, void>('waitForBackground');
  onWaitForActive = this._peer.createMethodHandler<WaitForActiveParams, void>('waitForActive');
  onForegroundApp = this._peer.createMethodHandler<ForegroundAppParams, void>('foregroundApp');
  onShake = this._peer.createMethodHandler<ShakeParams, void>('shake');
  onSetOrientation = this._peer.createMethodHandler<SetOrientationParams, void>('setOrientation');
  onDeliverPayload = this._peer.createMethodHandler<DeliverPayloadParams, void>('deliverPayload');
  onSetSyncSettings = this._peer.createMethodHandler<SetSyncSettingsParams, void>('setSyncSettings');
  onCurrentStatus = this._peer.createMethodHandler<CurrentStatusParams, CurrentStatusResult>('currentStatus');
  onCaptureViewHierarchy = this._peer.createMethodHandler<CaptureViewHierarchyParams, CaptureViewHierarchyResult>('captureViewHierarchy');
  onGenerateViewHierarchyXml = this._peer.createMethodHandler<GenerateViewHierarchyXmlParams, GenerateViewHierarchyXmlResult>('generateViewHierarchyXml');
}