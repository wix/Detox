//
//  Executor+reportCurrentStatus.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension Executor {
  /// Handles test-target current status reporting.
  func reportCurrentStatus(messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do cleanup", type: .error)
      return
    }

    let status = execute(whiteBoxRequest: .requestCurrentStatus)

    guard case let .status(result) = status else {
      execLog("the received current-status has an invalid type", type: .error)
      fatalError("The received current-status has an invalid type")
    }

    let params: [String: Any] = [
      "status": result.value,
      "messageId": messageId
    ]

    execLog("reporting current app status: \(params)")
    if (JSONSerialization.isValidJSONObject(params) == false) {
      execLog("invalid json object detected! (\(params)", type: .error)
    }

    serverMessageSender.sendAction(
      .reportStatus,
      params: params,
      messageId: messageId
    )
  }
}
