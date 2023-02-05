//
//  Executor+cleanup.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Extends the executor with connection handling methods.
extension Executor {
  /// Handles app cleanup.
  func cleanup(params: [String: AnyHashable], messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do cleanup", type: .error)
      return
    }

    execLog(
      "starting cleanup with params: \(String(describing: params)) (message id: `\(messageId)`)",
      type: .debug
    )

    serverMessageSender.cleanup()
    execLog("cleanup done (message id: `\(messageId)`)", type: .debug)

    sendAction(.reportCleanupDone, messageId: messageId)
    execLog("cleanup reported (message id: `\(messageId)`)", type: .debug)

    execLog("stopping runner: \(params.stopRunner)", type: .debug)
    if (params.stopRunner) {
      disconnect(messageId: messageId)
    }
  }

  /// Handles test-target disconnection
  func disconnect(messageId: NSNumber) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, can't do disconnection", type: .error)
      fatalError("`serverMessageSender` is nil, can't do clean disconnection")
    }

    execLog("starting disconnect.. (message id: `\(messageId)`)", type: .debug)

    serverMessageSender.disconnect()
    execLog("disconnect done (message id: `\(messageId)`)", type: .debug)
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var stopRunner: Bool {
    return self["stopRunner"] as? Bool ?? false
  }
}
