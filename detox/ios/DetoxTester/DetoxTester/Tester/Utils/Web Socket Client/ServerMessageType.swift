//
//  ServerMessageType.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Type of a web-socket action that can be received from Detox Server.
enum ServerMessageType: String {
  /// Disconnect from the tester.
  case disconnect = "testerDisconnected"

  /// Set recording state.
  case setRecordingState = "setRecordingState"

  /// Wait for app to be in foreground.
  case waitForActive = "waitForActive"

  /// Send app to home screen.
  case sendToHome = "sendToHome"

  /// Wait for app to be in background.
  case waitForBackground = "waitForBackground"

  /// Wait for app to be idle.
  case waitForIdle = "waitForIdle"

  /// Set sync settings.
  case setSyncSettings = "setSyncSettings"

  /// Invoke an operation.
  case invoke = "invoke"

  /// Check if app is ready.
  case isReady = "isReady"

  /// Cleanup tester.
  case cleanup = "cleanup"

  /// Deliver payload.
  case deliverPayload = "deliverPayload"

  /// Set device orientation.
  case setOrientation = "setOrientation"

  /// Shake device.
  case shakeDevice = "shakeDevice"

  /// Reload React Native.
  case reactNativeReload = "reactNativeReload"

  /// Get current app status.
  case currentStatus = "currentStatus"

  /// Login success.
  case loginSuccess = "loginSuccess"

  /// Capture view hierarchy.
  case captureViewHierarchy = "captureViewHierarchy"

  /// Terminate tester.
  case terminate = "terminate"
}
