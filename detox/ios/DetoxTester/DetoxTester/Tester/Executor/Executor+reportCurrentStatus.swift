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

    let status = execute(whiteBoxRequest: .currentStatus)

    sendAction(.reportStatus, params: ["status": status], messageId: messageId)
  }
}
