//
//  ServerMessageType+isBackgroundTask.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

///
extension ServerMessageType {
  /// Determines whether the server message should be handled in a background manner.
  var isBackgroundTask: Bool {
    switch self {
      case .currentStatus, .terminate:
        return true

      case .disconnect, .setRecordingState, .setSyncSettings, .cleanup, .deliverPayload,
          .reactNativeReload, .captureViewHierarchy, .waitForActive, .waitForBackground,
          .waitForIdle, .invoke, .isReady, .setOrientation,
          .shakeDevice, .loginSuccess:
        return false
    }
  }
}
