//
//  WebSocketReceiveActionType+isWhiteBoxAction.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension WebSocketReceiveActionType {
  var isWhiteBox: Bool {
    switch self {
      case .disconnect, .setRecordingState, .waitForActive, .waitForBackground, .waitForIdle,
          .setSyncSettings, .invoke, .isReady, .cleanup, .deliverPayload, .setOrientation,
          .shakeDevice, .reactNativeReload, .currentStatus, .loginSuccess, .captureViewHierarchy:
        return false
    }
  }
}
