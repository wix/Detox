//
//  Executor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

class Executor {
  /// Used to send actions back.
  private(set) var serverMessageSender: ServerMessageSenderProtocol!

  /// Used to handle the target application directly (within the app target).
  private(set) var appHandler: AppHandlerProtocol!

  /// Executes the given operation from the XCTest bundle.
  func execute(
    _ action: WebSocketReceiveActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    execLog("executes action: \(action)")

    switch action {
      case .disconnect, .setRecordingState, .waitForBackground, .waitForIdle,
          .setSyncSettings, .deliverPayload, .setOrientation,
          .shakeDevice, .captureViewHierarchy:
        execLog("action not implemented yet (action: `\(action)`)", type: .error)
        fatalError("Unexpected action execution (unimplemented operation): \(action)")

      case .invoke:
        handleInvoke(action, params: params, messageId: messageId)

      case .waitForActive:
        sendAction(.reportWaitForActiveDone, params: [:], messageId: messageId)

      case .reactNativeReload:
        handleReactNativeReload(messageId: messageId)
        fatalError("Text expectation is not supported by the XCUITest target")

      case .isReady:
        sendAction(.reportReady, params: [:], messageId: messageId)

      case .loginSuccess:
        execLog("successfully logged-in to detox server")

      case .currentStatus:
        handleCurrentStatus(messageId: messageId)

      case .cleanup:
        handleCleanup(messageId: messageId)
    }
  }

  func setServerMessageSender(_ sender: ServerMessageSenderProtocol) {
    self.serverMessageSender = sender
  }
}
