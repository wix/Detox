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
      execLog("the invoke-handler failed to handle params: \(error)", type: .error)

      // TODO: replace this with a proper failure message to the app...
      fatalError("Error while executing invoke")
    }

    guard let result = (handlerResult?.value ?? [:]) as? [String : AnyHashable]
    else {
      execLog(
        "failed to handle invoke-handler result: `\(String(describing: handlerResult?.value))`",
        type: .error
      )

      // TODO: replace this with a proper failure message to the app...
      fatalError("Error while executing invoke")
    }

    sendAction(
      .reportInvokeResult,
      params: result,
      messageId: messageId
    )
  }
}
