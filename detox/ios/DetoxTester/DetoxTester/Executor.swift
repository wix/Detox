//
//  Executor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

public class Executor {
  /// Used to handle `invoke` messages.
  private let invokeHandler = InvokeHandler(
    elementMatcher: ElementMatcher(
      // TODO: need to replace with current:
      app: XCUIApplication(bundleIdentifier: "com.wix.detox-example")
    ),
    actionDelegate: ActionDelegate(),
    expectationDelegate: ExpectationDelegate()
  )

  /// Used to send actions back.
  public var delegate: ExecutorDelegateProtocol?

  /// Executes given operation.
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
        handleInvoke(invokeHandler: invokeHandler, action, params: params, messageId: messageId)

      case .waitForActive:
        sendAction(.reportWaitForActiveDone, params: [:], messageId: messageId)

      case .reactNativeReload:
        handleReactNativeReload(messageId: messageId)

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
}
