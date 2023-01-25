//
//  DetoxServerMessageSenderProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `Executor`.
protocol DetoxServerMessageSenderProtocol: AnyObject {
  /// Send action with `type`, `params` and `messageId`.
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: Any],
    messageId: NSNumber
  )

  /// Do cleanup of Detox tester.
  func cleanup()
}

/// Type of a web-socket action to be sent from Detox Tester back to Detox Server.
enum ResponseMessageType: String {
  case reportReady = "ready"
  case reportSetSyncSettingsDone = "setSyncSettingsDone"
  case reportWebSocketDidOpen = "login"
  case reportStatus = "currentStatusResult"
  case reportCleanupDone = "cleanupDone"
  case reportWaitForBackgroundDone = "waitForBackgroundDone"
  case reportWaitForForegroundDone = "waitForActiveDone"
  case reportWaitForIdleDone = "waitForIdleDone"
  case reportInvokeResult = "invokeResult"
  case reportTestFailed = "testFailed"
  case reportCaptureViewHierarchyDone = "captureViewHierarchyDone"
  case reportShakeDeviceDone = "shakeDeviceDone"
}
