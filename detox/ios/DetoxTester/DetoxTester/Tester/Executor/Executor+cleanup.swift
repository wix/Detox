//
//  Executor+cleanup.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Handles test-target cleanup.
  func cleanup(messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do cleanup", type: .error)
      return
    }

    if isWhiteBoxExecutorAvailable() {
      execute(whiteBoxRequest: .cleanup).assertResponse(equalsTo: .completed)
    }

    sendAction(.reportCleanupDone, messageId: messageId)
    serverMessageSender.cleanup()
  }
}