//
//  ServerMessageType.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Type of a web-socket action that can be received from Detox Server.
enum ServerMessageType: String {
  case disconnect = "testerDisconnected"
  case setRecordingState = "setRecordingState"
  case waitForActive = "waitForActive"
  case waitForBackground = "waitForBackground"
  case waitForIdle = "waitForIdle"
  case setSyncSettings = "setSyncSettings"
  case invoke = "invoke"
  case isReady = "isReady"
  case cleanup = "cleanup"
  case deliverPayload = "deliverPayload"
  case setOrientation = "setOrientation"
  case shakeDevice = "shakeDevice"
  case reactNativeReload = "reactNativeReload"
  case currentStatus = "currentStatus"
  case loginSuccess = "loginSuccess"
  case captureViewHierarchy = "captureViewHierarchy"
}
