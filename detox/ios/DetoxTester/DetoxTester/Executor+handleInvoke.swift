//
//  Executor+handleInvoke.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension Executor {
  /// Handles invoke messages.
  func handleInvoke(
    invokeHandler: InvokeHandler,
    _ action: WebSocketReceiveActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
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
  }
}
