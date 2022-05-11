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
      case .loginSuccess:
        execLog("successfully logged in to Detox server")

      case .disconnect:
        if isWhiteBoxExecutorAvailable() {
          execute(whiteBoxRequest: .disconnect).assertResponse(equalsTo: .none)
        }

        handleCleanup(messageId: messageId)

      case .setRecordingState:
        fatalError("not implemented yet")

      case .waitForBackground:
        let result1 = getAppUnderTest().wait(for: .runningBackground, timeout: 555)
        let result2 = getAppUnderTest().wait(for: .runningBackgroundSuspended, timeout: 555)
        guard result1 || result2 == true else {
          fatalError("handle failure..")
        }
        fatalError("TODO: complete the implementation...")

      case .waitForIdle:
        if isWhiteBoxExecutorAvailable() {
          execute(whiteBoxRequest: .waitFor(.idle)).assertResponse(equalsTo: .none)
        }

      case .setSyncSettings:
        fatalError("not implemented yet")

      case .deliverPayload:
        fatalError("not implemented yet")

      case.setOrientation:
        fatalError("not implemented yet")

      case .currentStatus:
        fatalError("not implemented yet")

      case .shakeDevice:
        fatalError("not implemented yet")

      case .captureViewHierarchy:
        fatalError("not implemented yet")

      case .waitForActive:
        let result = getAppUnderTest().wait(for: .runningForeground, timeout: 555)
        guard result == true else {
          fatalError("handle failure..")
        }
        fatalError("TODO: complete the implementation...")

      case.reactNativeReload:
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
