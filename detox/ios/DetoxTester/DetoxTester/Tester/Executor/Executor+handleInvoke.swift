//
//  Executor+handleInvoke.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

/// Returns `nil` if unable to handle message in a white-box matter.
typealias WhiteBoxMessageHandler = (WhiteBoxExecutor.Message) -> WhiteBoxExecutor.Response?

extension Executor {
  /// Handles invoke messages.
  func handleInvoke(
    params: [String: AnyHashable],
    messageId: NSNumber
  ) throws {
    let app = XCUIApplication.selectedApp

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
      webActionDelegate: WebActionDelegate(app),
      expectationDelegate: ExpectationDelegate(app, whiteBoxMessageHandler: whiteBoxMessageHandler),
      webExpectationDelegate: WebExpectationDelegate()
    )

    let handlerResult = try handler.handle(params)

    guard let result = (
      handlerResult?.value ?? [:] as [String : Any]
    ) as? [String : Any]
    else {
      let resultString = String(describing: handlerResult?.value)
      throw Error.failedToHandleResponse(received: resultString)
    }

    sendAction(
      .reportInvokeResult,
      params: result,
      messageId: messageId
    )
  }
}
