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

    serverMessageSender.sendAction(
      .reportStatus,
      params: ["status": statusValue],
      messageId: messageId
    )
  }
}
