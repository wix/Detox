//
//  ServerMessageSenderProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `Executor`.
protocol ServerMessageSenderProtocol: AnyObject {
  /// Send action with `type`, `params` and `messageId`.
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  )

  /// Do cleanup of Detox tester.
  func cleanup()
}

/// Type of a web-socket action to be sent from Detox Tester back to Detox Server.
enum ResponseMessageType: String {
  case reportReady = "ready"
  case reportWebSocketDidOpen = "login"
  case reportStatus = "currentStatusResult"
  case reportCleanupDone = "cleanupDone"
  case reportWaitForActiveDone = "waitForActiveDone"
  case reportInvokeResult = "invokeResult"
}
