//
//  ServerMessageType+isAsync.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

///
extension ServerMessageType {
  /// Determines whether the server message should be handled in async manner.
  var handleAsync: Bool {
    switch self {
      case .disconnect, .setRecordingState, .setSyncSettings, .cleanup, .deliverPayload,
          .reactNativeReload, .currentStatus, .captureViewHierarchy:
        return true

      case .waitForActive, .waitForBackground, .waitForIdle, .invoke, .isReady, .setOrientation,
          .shakeDevice, .loginSuccess, .terminate:
        return false
    }
  }
}
