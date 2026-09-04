import type { CallOptions, Peer } from '@detox-remote/core';
import type { DetoxClientPeer as IDetoxClientPeer, ServerInfoNotification, LogNotification } from '@detox-remote/protocol';
import { SERVER_INFO_METHOD, LOG_METHOD } from '@detox-remote/protocol';
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
  AttachAppParams,
  ActivateAppParams,
  AppHandleResult,
  ConnectedAppsParams,
  ConnectedAppsResult,
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
  /**
   * The step the caller is inside right now (spec 013), read as each
   * request frame is built: one seam for every call path — the operation
   * registry's verbs and the app handle's invoke lane alike — so no call
   * site can forget to say which step it belongs to. Absent, frames carry
   * no `step`.
   */
  stepOf?: () => string | undefined;
}

class DetoxClientPeerBase {
  protected _peer: Peer;
  private _stepOf: (() => string | undefined) | undefined;
  constructor(deps: DetoxClientPeerDeps) {
    this._peer = deps.peer;
    this._stepOf = deps.stepOf;
  }

  /** A typed request method; an explicit `opts.step` beats the ambient one. */
  protected _method<P, R>(method: string): (params: P, opts?: CallOptions) => Promise<R> {
    return (params: P, opts?: CallOptions) => {
      const step = opts?.step ?? this._stepOf?.();
      return this._peer.request<R>({ method, params, ...opts, ...(step !== undefined ? { step } : {}) });
    };
  }
}

export class DetoxClientPeer extends DetoxClientPeerBase implements IDetoxClientPeer {
  allocateDevice = this._method<AllocateDeviceRequest, AllocateDeviceResponse>('allocateDevice');
  bootDevice = this._method<BootDeviceRequest, BootDeviceResponse>('bootDevice');
  shutdownDevice = this._method<ShutdownDeviceRequest, ShutdownDeviceResponse>('shutdownDevice');
  releaseDevice = this._method<ReleaseDeviceRequest, ReleaseDeviceResponse>('releaseDevice');
  onDeviceStateChanged = this._peer.createNotificationHandler<DeviceStateChangedNotification>('deviceStateChanged');
  onServerInfo = this._peer.createNotificationHandler<ServerInfoNotification>(SERVER_INFO_METHOD);
  notifyLog = this._peer.createNotification<LogNotification>(LOG_METHOD);
  installApp = this._method<InstallAppParams, void>('installApp');
  uninstallApp = this._method<UninstallAppParams, void>('uninstallApp');
  launchApp = this._method<LaunchAppParams, LaunchAppResult>('launchApp');
  attachApp = this._method<AttachAppParams, AppHandleResult>('attachApp');
  activateApp = this._method<ActivateAppParams, AppHandleResult>('activateApp');
  connectedApps = this._method<ConnectedAppsParams, ConnectedAppsResult>('connectedApps');
  terminateApp = this._method<TerminateAppParams, void>('terminateApp');
  setPermissions = this._method<SetPermissionsParams, void>('setPermissions');
  sendToHome = this._method<SendToHomeParams, void>('sendToHome');
  openURL = this._method<OpenURLParams, void>('openURL');
  setLocation = this._method<SetLocationParams, void>('setLocation');
  clearKeychain = this._method<ClearKeychainParams, void>('clearKeychain');
  resetContentAndSettings = this._method<ResetContentAndSettingsParams, void>('resetContentAndSettings');
  takeScreenshot = this._method<TakeScreenshotParams, TakeScreenshotResult>('takeScreenshot');
  reverseTcpPort = this._method<ReverseTcpPortParams, void>('reverseTcpPort');
  unreverseTcpPort = this._method<UnreverseTcpPortParams, void>('unreverseTcpPort');
  setBiometricEnrollment = this._method<SetBiometricEnrollmentParams, void>('setBiometricEnrollment');
  matchFace = this._method<MatchFaceParams, void>('matchFace');
  unmatchFace = this._method<UnmatchFaceParams, void>('unmatchFace');
  matchFinger = this._method<MatchFingerParams, void>('matchFinger');
  unmatchFinger = this._method<UnmatchFingerParams, void>('unmatchFinger');
  setStatusBar = this._method<SetStatusBarParams, void>('setStatusBar');
  resetStatusBar = this._method<ResetStatusBarParams, void>('resetStatusBar');
  invoke = this._method<InvokeParams, InvokeResult>('invoke');
  reloadReactNative = this._method<ReloadReactNativeParams, void>('reloadReactNative');
  waitForBackground = this._method<WaitForBackgroundParams, void>('waitForBackground');
  waitForActive = this._method<WaitForActiveParams, void>('waitForActive');
  foregroundApp = this._method<ForegroundAppParams, void>('foregroundApp');
  shake = this._method<ShakeParams, void>('shake');
  setOrientation = this._method<SetOrientationParams, void>('setOrientation');
  deliverPayload = this._method<DeliverPayloadParams, void>('deliverPayload');
  setSyncSettings = this._method<SetSyncSettingsParams, void>('setSyncSettings');
  currentStatus = this._method<CurrentStatusParams, CurrentStatusResult>('currentStatus');
  captureViewHierarchy = this._method<CaptureViewHierarchyParams, CaptureViewHierarchyResult>('captureViewHierarchy');
  generateViewHierarchyXml = this._method<GenerateViewHierarchyXmlParams, GenerateViewHierarchyXmlResult>('generateViewHierarchyXml');
}
