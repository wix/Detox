//
//  Executor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

/// Executes all Detox UI operations.
class Executor {
  /// Used to send actions back.
  private(set) var serverMessageSender: ServerMessageSenderProtocol!

  /// Executes the given operation from the XCTest bundle.
  func execute(
    _ action: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    execLog("executes action: \(action)")

    switch action {
      case .loginSuccess, .disconnect, .setRecordingState, .waitForBackground, .waitForIdle,
          .setSyncSettings, .deliverPayload, .setOrientation, .currentStatus,
          .shakeDevice, .captureViewHierarchy, .waitForActive, .reactNativeReload:
        fatalError("not implemented yet")

      case .invoke:
        handleInvoke(params: params, messageId: messageId)

      case .isReady:
        sendAction(.reportReady, params: [:], messageId: messageId)

      case .cleanup:
        handleCleanup(messageId: messageId)
    }
  }

  func setServerMessageSender(_ sender: ServerMessageSenderProtocol) {
    self.serverMessageSender = sender
  }
}
