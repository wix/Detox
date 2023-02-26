//
//  Executor+cleanup.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Extends the executor with connection handling methods.
extension Executor {
  /// Handles app cleanup.
  func cleanup(params: [String: AnyHashable], messageId: NSNumber) {
    execLog("executor called to cleanup", type: .debug)
    sendAction(.reportCleanupDone, messageId: messageId)
  }

  /// Handles test-target disconnection.
  func disconnect(messageId: NSNumber) {
    execLog("executor called to disconnect, going to terminate", type: .debug)
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do disconnection", type: .error)
      fatalError("`serverMessageSender` is nil, can't do clean disconnection")
    }

    serverMessageSender.terminate()
  }

  /// Handles termination requests by the test runner.
  func terminate(messageId: NSNumber) {
    execLog("executor called to terminate", type: .debug)

    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do termination", type: .error)
      fatalError("`serverMessageSender` is nil, can't do termination")
    }

    sendAction(.reportWillTerminate, messageId: messageId)
    serverMessageSender.terminate()
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var stopRunner: Bool {
    return self["stopRunner"] as? Bool ?? false
  }
}
