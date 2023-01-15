//
//  Executor+handleInvoke.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

/// Returns `nil` if unable to handle message in a white-box matter.
typealias WhiteBoxMessageHandler = (WhiteBoxExecutor.Message) -> WhiteBoxExecutor.Response?

extension Executor {
  /// Handles invoke messages.
  func handleInvoke(
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    let app = getAppUnderTest()

    let whiteBoxMessageHandler: WhiteBoxMessageHandler = { message in
      if self.isWhiteBoxExecutorAvailable() {
        return self.execute(whiteBoxRequest: message)
      }

      execLog(
        "unable to send message to the app handler (\(message), app cannot be white-box handled",
        type: .error
      )

      return nil
    }

    let handler = InvokeHandler(
      elementMatcher: ElementMatcher(app, whiteBoxMessageHandler: whiteBoxMessageHandler),
      actionDelegate: ActionDelegate(app, whiteBoxMessageHandler: whiteBoxMessageHandler),
      expectationDelegate: ExpectationDelegate(app, whiteBoxMessageHandler: whiteBoxMessageHandler)
    )

    var handlerResult: AnyCodable?
    do {
      handlerResult = try handler.handle(params)
    } catch {
      let errorMessage = "XCUITest executor failed to handle request: \(error)"
      execLog(errorMessage, type: .error)

      // TODO: add "viewHierarchy" param (#3830). This should be a white-box command.
      sendAction(
        .reportTestFailed,
        params: [
          "details": errorMessage
        ],
        messageId: messageId
      )

      return
    }

    guard let result = (handlerResult?.value ?? [:]) as? [String : AnyHashable]
    else {
      let errorMessage = "XCUITest executor failed to handle response: " +
        "`\(String(describing: handlerResult?.value))`"

      execLog(errorMessage, type: .error)

      // TODO: add "viewHierarchy" param (#3830).
      sendAction(
        .reportTestFailed,
        params: [
          "details": errorMessage
        ],
        messageId: messageId
      )

      return
    }

    sendAction(
      .reportInvokeResult,
      params: result,
      messageId: messageId
    )
  }
}
