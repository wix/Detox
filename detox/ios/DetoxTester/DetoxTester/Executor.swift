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
    action: WebSocketReceiveActionType,
    params: [String : Any],
    messageId: NSNumber
  ) {
    switch action {
      case .disconnect:
        fatalError("Not implemented yet")

      case .setRecordingState:
        fatalError("Not implemented yet")

      case .waitForActive:
        fatalError("Not implemented yet")

      case .waitForBackground:
        fatalError("Not implemented yet")

      case .waitForIdle:
        fatalError("Not implemented yet")

      case .setSyncSettings:
        fatalError("Not implemented yet")

      case .invoke:
        fatalError("Not implemented yet")

      case .isReady:
        fatalError("Not implemented yet")

      case .cleanup:
        fatalError("Not implemented yet")

      case .deliverPayload:
        fatalError("Not implemented yet")

      case .setOrientation:
        fatalError("Not implemented yet")

      case .shakeDevice:
        fatalError("Not implemented yet")

      case .reactNativeReload:
        fatalError("Not implemented yet")

      case .currentStatus:
        fatalError("Not implemented yet")

      case .loginSuccess:
        fatalError("Not implemented yet")

      case .captureViewHierarchy:
        fatalError("Not implemented yet")
    }
  }
}
