// Detox Peer contract interfaces

import type { RequestHandler, CallOptions } from '@detox-remote/core';
import type {
  AllocateDeviceRequest,
  AllocateDeviceResponse,
} from './allocation';
import type {
  BootDeviceRequest,
  BootDeviceResponse,
  DeviceStateChangedNotification,
  ReleaseDeviceRequest,
  ReleaseDeviceResponse,
  ShutdownDeviceRequest,
  ShutdownDeviceResponse,
} from './lifecycle';
import type {
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
} from './device';
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
} from './app';
import type {
  SetBiometricEnrollmentParams,
  MatchFaceParams,
  UnmatchFaceParams,
  MatchFingerParams,
  UnmatchFingerParams,
  SetStatusBarParams,
  ResetStatusBarParams,
} from './misc';
import type { ServerInfoNotification } from './handshake';

export interface DetoxClientPeer {
  // Allocation & lifecycle
  allocateDevice(params: AllocateDeviceRequest, opts?: CallOptions): Promise<AllocateDeviceResponse>;
  bootDevice(params: BootDeviceRequest, opts?: CallOptions): Promise<BootDeviceResponse>;
  shutdownDevice(params: ShutdownDeviceRequest, opts?: CallOptions): Promise<ShutdownDeviceResponse>;
  releaseDevice(params: ReleaseDeviceRequest, opts?: CallOptions): Promise<ReleaseDeviceResponse>;
  /** Server→client push: an allocated device changed runtime state. */
  onDeviceStateChanged(handler: (params: DeviceStateChangedNotification) => void): void;
  /** Server→client, first frame of every connection: the version announce. */
  onServerInfo(handler: (params: ServerInfoNotification) => void): void;

  // Device actions (simctl/adb)
  installApp(params: InstallAppParams, opts?: CallOptions): Promise<void>;
  uninstallApp(params: UninstallAppParams, opts?: CallOptions): Promise<void>;
  launchApp(params: LaunchAppParams, opts?: CallOptions): Promise<LaunchAppResult>;
  terminateApp(params: TerminateAppParams, opts?: CallOptions): Promise<void>;
  setPermissions(params: SetPermissionsParams, opts?: CallOptions): Promise<void>;
  sendToHome(params: SendToHomeParams, opts?: CallOptions): Promise<void>;
  openURL(params: OpenURLParams, opts?: CallOptions): Promise<void>;
  setLocation(params: SetLocationParams, opts?: CallOptions): Promise<void>;
  clearKeychain(params: ClearKeychainParams, opts?: CallOptions): Promise<void>;
  resetContentAndSettings(params: ResetContentAndSettingsParams, opts?: CallOptions): Promise<void>;
  takeScreenshot(params: TakeScreenshotParams, opts?: CallOptions): Promise<TakeScreenshotResult>;
  reverseTcpPort(params: ReverseTcpPortParams, opts?: CallOptions): Promise<void>;
  unreverseTcpPort(params: UnreverseTcpPortParams, opts?: CallOptions): Promise<void>;

  // Biometrics & Status bar (device-level)
  setBiometricEnrollment(params: SetBiometricEnrollmentParams, opts?: CallOptions): Promise<void>;
  matchFace(params: MatchFaceParams, opts?: CallOptions): Promise<void>;
  unmatchFace(params: UnmatchFaceParams, opts?: CallOptions): Promise<void>;
  matchFinger(params: MatchFingerParams, opts?: CallOptions): Promise<void>;
  unmatchFinger(params: UnmatchFingerParams, opts?: CallOptions): Promise<void>;
  setStatusBar(params: SetStatusBarParams, opts?: CallOptions): Promise<void>;
  resetStatusBar(params: ResetStatusBarParams, opts?: CallOptions): Promise<void>;

  // App actions (via WebSocket to running app)
  invoke(params: InvokeParams, opts?: CallOptions): Promise<InvokeResult>;
  reloadReactNative(params: ReloadReactNativeParams, opts?: CallOptions): Promise<void>;
  waitForBackground(params: WaitForBackgroundParams, opts?: CallOptions): Promise<void>;
  waitForActive(params: WaitForActiveParams, opts?: CallOptions): Promise<void>;
  foregroundApp(params: ForegroundAppParams, opts?: CallOptions): Promise<void>;
  shake(params: ShakeParams, opts?: CallOptions): Promise<void>;
  setOrientation(params: SetOrientationParams, opts?: CallOptions): Promise<void>;
  deliverPayload(params: DeliverPayloadParams, opts?: CallOptions): Promise<void>;
  setSyncSettings(params: SetSyncSettingsParams, opts?: CallOptions): Promise<void>;
  currentStatus(params: CurrentStatusParams, opts?: CallOptions): Promise<CurrentStatusResult>;
  captureViewHierarchy(params: CaptureViewHierarchyParams, opts?: CallOptions): Promise<CaptureViewHierarchyResult>;
  generateViewHierarchyXml(params: GenerateViewHierarchyXmlParams, opts?: CallOptions): Promise<GenerateViewHierarchyXmlResult>;
}

export interface DetoxServerPeer {
  // Allocation & lifecycle
  onAllocateDevice(handler: RequestHandler<AllocateDeviceRequest, AllocateDeviceResponse>): void;
  onBootDevice(handler: RequestHandler<BootDeviceRequest, BootDeviceResponse>): void;
  onShutdownDevice(handler: RequestHandler<ShutdownDeviceRequest, ShutdownDeviceResponse>): void;
  onReleaseDevice(handler: RequestHandler<ReleaseDeviceRequest, ReleaseDeviceResponse>): void;
  /** Server→client push: an allocated device changed runtime state. */
  notifyDeviceStateChanged(params: DeviceStateChangedNotification): void;
  /** Server→client, first frame of every connection: the version announce. */
  notifyServerInfo(params: ServerInfoNotification): void;

  // Device actions (simctl/adb)
  onInstallApp(handler: RequestHandler<InstallAppParams, void>): void;
  onUninstallApp(handler: RequestHandler<UninstallAppParams, void>): void;
  onLaunchApp(handler: RequestHandler<LaunchAppParams, LaunchAppResult>): void;
  onTerminateApp(handler: RequestHandler<TerminateAppParams, void>): void;
  onSetPermissions(handler: RequestHandler<SetPermissionsParams, void>): void;
  onSendToHome(handler: RequestHandler<SendToHomeParams, void>): void;
  onOpenURL(handler: RequestHandler<OpenURLParams, void>): void;
  onSetLocation(handler: RequestHandler<SetLocationParams, void>): void;
  onClearKeychain(handler: RequestHandler<ClearKeychainParams, void>): void;
  onResetContentAndSettings(handler: RequestHandler<ResetContentAndSettingsParams, void>): void;
  onTakeScreenshot(handler: RequestHandler<TakeScreenshotParams, TakeScreenshotResult>): void;
  onReverseTcpPort(handler: RequestHandler<ReverseTcpPortParams, void>): void;
  onUnreverseTcpPort(handler: RequestHandler<UnreverseTcpPortParams, void>): void;

  // Biometrics & Status bar (device-level)
  onSetBiometricEnrollment(handler: RequestHandler<SetBiometricEnrollmentParams, void>): void;
  onMatchFace(handler: RequestHandler<MatchFaceParams, void>): void;
  onUnmatchFace(handler: RequestHandler<UnmatchFaceParams, void>): void;
  onMatchFinger(handler: RequestHandler<MatchFingerParams, void>): void;
  onUnmatchFinger(handler: RequestHandler<UnmatchFingerParams, void>): void;
  onSetStatusBar(handler: RequestHandler<SetStatusBarParams, void>): void;
  onResetStatusBar(handler: RequestHandler<ResetStatusBarParams, void>): void;

  // App actions (via WebSocket to running app)
  onInvoke(handler: RequestHandler<InvokeParams, InvokeResult>): void;
  onReloadReactNative(handler: RequestHandler<ReloadReactNativeParams, void>): void;
  onWaitForBackground(handler: RequestHandler<WaitForBackgroundParams, void>): void;
  onWaitForActive(handler: RequestHandler<WaitForActiveParams, void>): void;
  onForegroundApp(handler: RequestHandler<ForegroundAppParams, void>): void;
  onShake(handler: RequestHandler<ShakeParams, void>): void;
  onSetOrientation(handler: RequestHandler<SetOrientationParams, void>): void;
  onDeliverPayload(handler: RequestHandler<DeliverPayloadParams, void>): void;
  onSetSyncSettings(handler: RequestHandler<SetSyncSettingsParams, void>): void;
  onCurrentStatus(handler: RequestHandler<CurrentStatusParams, CurrentStatusResult>): void;
  onCaptureViewHierarchy(handler: RequestHandler<CaptureViewHierarchyParams, CaptureViewHierarchyResult>): void;
  onGenerateViewHierarchyXml(handler: RequestHandler<GenerateViewHierarchyXmlParams, GenerateViewHierarchyXmlResult>): void;
}
