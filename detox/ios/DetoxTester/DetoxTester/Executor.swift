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
        do {
          let _result = try invokeHandler.handle(params)

          guard let result = (_result?.value ?? [:]) as? [String : AnyHashable]
          else {
            execLog(
              "failed to cast invoke handle-result: `\(String(describing: _result?.value))`",
              type: .error
            )
            fatalError("Error while executing invoke")
          }

          sendAction(
            .reportInvokeResult,
            params: result,
            messageId: messageId
          )
        } catch {
          execLog("invoke error: \(error)", type: .error)
          fatalError("Error while executing invoke")
        }

      case .waitForActive:
        sendAction(.reportWaitForActiveDone, params: [:], messageId: messageId)


      case .reactNativeReload:
        let app = XCUIApplication(bundleIdentifier: "com.wix.detox-example")
        app.terminate()
        app.launch()

        sendAction(.reportReady, params: [:], messageId: messageId)

      case .isReady:
        sendAction(.reportReady, params: [:], messageId: messageId)

      case .loginSuccess:
        execLog("successfully logged-in to detox server")

      case .currentStatus:
        // Always report that the app is idle. XCUITest already handles the app-status
        // synchronization.
        sendAction(
          .reportStatus,
          params: [
            "messageId": messageId,
            "status": ["app_status": "idle"]
          ],
          messageId: messageId
        )

      case .cleanup:
        sendAction(.reportCleanupDone, params: [:], messageId: messageId)
    }
  }

  private func sendAction(
    _ type: WebSocketSendActionType,
    params: [String : AnyHashable],
    messageId: NSNumber
  ) {
    guard let delegate = delegate else {
      execLog("delegate is nil", type: .error)
      fatalError("Can't use nil delegate")
    }

    delegate.sendAction(type, params: params, messageId: messageId)
  }
}
