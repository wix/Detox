//
//  ServerMessageSenderProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `Executor`.
protocol ServerMessageSenderProtocol: AnyObject {
  /// Send action.
  func sendAction(
    _ type: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  )

  /// Do cleanup of Detox tester.
  func cleanup()
}

/// Type of a web-socket action to be sent from Detox Tester to Detox Server.
enum ServerMessageType: String {
  case reportReady = "ready"
  case reportWebSocketDidOpen = "login"
  case reportStatus = "currentStatusResult"
  case reportCleanupDone = "cleanupDone"
  case reportWaitForActiveDone = "waitForActiveDone"
  case reportInvokeResult = "invokeResult"
}
