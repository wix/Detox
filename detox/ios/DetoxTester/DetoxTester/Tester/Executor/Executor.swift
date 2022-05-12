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
        execLog("successfully logged into Detox server")

      case .disconnect:
        disconnect(messageId: messageId)

      case .setRecordingState:
        fatalError("not implemented yet")

      case .waitForBackground:
        waitFor(appState: .background, messageId: messageId)

      case .waitForIdle:
        if isWhiteBoxExecutorAvailable() {
          execute(whiteBoxRequest: .waitFor(.idle)).assertResponse(equalsTo: .none)
        }

      case .setSyncSettings:
        setSyncSettings(params: params, messageId: messageId)

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
        waitFor(appState: .foreground, messageId: messageId)

      case.reactNativeReload:
        fatalError("not implemented yet")

      case .invoke:
        handleInvoke(params: params, messageId: messageId)

      case .isReady:
        sendAction(.reportReady, messageId: messageId)

      case .cleanup:
        cleanup(messageId: messageId)
    }
  }

  func setServerMessageSender(_ sender: ServerMessageSenderProtocol) {
    self.serverMessageSender = sender
  }
}
