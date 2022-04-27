//
//  Executor+handleCleanup.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Handles test-target cleanup.
  func handleCleanup(messageId: NSNumber) {
    guard let delegate = delegate else {
      execLog("delegate is nil, can't do cleanup", type: .error)
      return
    }

    sendAction(.reportCleanupDone, params: [:], messageId: messageId)
    delegate.cleanup()
  }
}
