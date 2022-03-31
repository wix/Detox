//
//  Executor+handleInvoke.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension Executor {
  /// Handles invoke messages.
  func handleInvoke(
    _ action: WebSocketReceiveActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    let handler = InvokeHandler(
      elementMatcher: ElementMatcher(app: app),
      actionDelegate: ActionDelegate.shared,
      expectationDelegate: ExpectationDelegate.shared
    )

    var handlerResult: AnyCodable?
    do {
      handlerResult = try handler.handle(params)
    } catch {
      execLog("invoke error: \(error)", type: .error)
      fatalError("Error while executing invoke")
    }

    guard let result = (handlerResult?.value ?? [:]) as? [String : AnyHashable]
    else {
      execLog(
        "failed to handle invoke-handler result: `\(String(describing: handlerResult?.value))`",
        type: .error
      )
      fatalError("Error while executing invoke")
    }

    sendAction(
      .reportInvokeResult,
      params: result,
      messageId: messageId
    )
  }
}
