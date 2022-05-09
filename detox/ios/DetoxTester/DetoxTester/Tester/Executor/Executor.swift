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
  private var whiteBoxHandler: WhiteBoxHandlerProtocol {
    return WhiteBoxHandler.getHandler(for: getAppUnderTestBundleIdentifier())
  }

  /// Executes the given operation from the XCTest bundle.
  func execute(
    _ action: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    execLog("executes action: \(action)")

    if whiteBoxHandle(action, params: params, messageId: messageId) {
      // Action was handled by the white-box handler.
      return
    }

    switch action {
      case .disconnect, .setRecordingState, .waitForBackground, .waitForIdle,
          .setSyncSettings, .deliverPayload, .setOrientation, .currentStatus,
          .shakeDevice, .captureViewHierarchy, .waitForActive, .reactNativeReload:
        execLog("action not implemented by XCUITest target (action: `\(action)`)", type: .error)
        fatalError("Unexpected action execution (unimplemented XCUITest operation): \(action)")

      case .invoke:
        handleInvoke(action, params: params, messageId: messageId)

      case .isReady:
        sendAction(.reportReady, params: [:], messageId: messageId)

      case .loginSuccess:
        execLog("successfully logged-in to detox server")

      case .cleanup:
        handleCleanup(messageId: messageId)
    }
  }

  func setServerMessageSender(_ sender: ServerMessageSenderProtocol) {
    self.serverMessageSender = sender
  }

  /// Returns `true` if handled succesfully by the white-box handler.
  private func whiteBoxHandle(
    _ action: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) -> Bool {
    guard
      let result = whiteBoxHandler.send(
        action, withParams: params, messageId: messageId
      ) as? [String: Any]
    else {
      return false
    }

    // TODO: do stuff with handle result...
    execLog("received from white-box handler: \(result)")
    

    return true
  }
}
