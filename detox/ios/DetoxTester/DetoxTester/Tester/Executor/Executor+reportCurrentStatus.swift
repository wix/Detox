//
//  Executor+reportCurrentStatus.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Handles test-target current status reporting.
  func reportCurrentStatus(messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do cleanup", type: .error)
      return
    }

    let status = execute(whiteBoxRequest: .requestCurrentStatus)

    guard case let .status(statusValue) = status else {
      execLog("the received current-status has an invalid type", type: .error)
      fatalError("The received current-status has an invalid type")
    }

    let params: [String: AnyHashable] = [
      "status": ["app_status": "idle"],
      "messageId": messageId
    ]

    // TODO: stop fake the current status!
    execLog("reporting status with params: \(params). real status result: \(statusValue)")

    serverMessageSender.sendAction(
      .reportStatus,
      params: params,
      messageId: messageId
    )
  }
}
