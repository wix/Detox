//
//  Executor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

public class Executor {
  /// Used to send actions back.
  public var delegate: ExecutorDelegateProtocol?

  /// Executes given operation.
  func execute(
    _ action: WebSocketReceiveActionType,
    params: [String : Any],
    messageId: NSNumber
  ) {
    execLog("executes action: \(action)")

    switch action {
      case .disconnect, .setRecordingState, .waitForBackground, .waitForIdle,
          .setSyncSettings, .invoke, .cleanup, .deliverPayload, .setOrientation,
          .shakeDevice, .reactNativeReload, .currentStatus, .captureViewHierarchy:
        execLog("not implemented yet (action: `\(action)`)", type: .error)
        fatalError("Unexpected action execution (unimplemented operation): \(action)")

      case .waitForActive:
        guard let delegate = delegate else {
          execLog("delegate is nil", type: .error)
          fatalError("Can't use nil delegate")
        }

      case .isReady:
        guard let delegate = delegate else {
          execLog("delegate is nil", type: .error)
          fatalError("Can't use nil delegate")
        }
        delegate.sendAction(.reportReady, params: [:], messageId: -1000)

      case .loginSuccess:
        execLog("successfully logged-in to detox server")
    }
  }
}
