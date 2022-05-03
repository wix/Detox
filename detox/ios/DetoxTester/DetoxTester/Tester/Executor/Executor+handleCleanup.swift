//
//  Executor+handleCleanup.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Handles test-target cleanup.
  func handleCleanup(messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do cleanup", type: .error)
      return
    }

    sendAction(.reportCleanupDone, params: [:], messageId: messageId)
    serverMessageSender.cleanup()
  }
}
