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

  /// Do cleanup of the Detox tester (close connection with app clients).
  func cleanup()

  /// Do disconnection of the Detox tester (close connection with JS tester server).
  func disconnect()

  /// Terminate the Detox tester.
  func terminate()
}

/// Type of a web-socket action to be sent from Detox Tester back to Detox Server.
enum ResponseMessageType: String {
  /// App is ready to receive new requests.
  case reportReady = "ready"

  /// Deliver payload was done.
  case reportDidDeliverPayload = "deliverPayloadDone"

  /// React Native reload was done.
  case reportSetSyncSettingsDone = "setSyncSettingsDone"

  /// Set orientation was done.
  case reportSetOrientationDone = "setOrientationDone"

  /// Web-socket did open (successful login).
  case reportWebSocketDidOpen = "login"

  /// Response with current app status.
  case reportStatus = "currentStatusResult"

  /// Cleanup was done.
  case reportCleanupDone = "cleanupDone"

  /// Wait for background was done. App is in background.
  case reportWaitForBackgroundDone = "waitForBackgroundDone"

  /// Wait for foreground was done. App is in foreground.
  case reportWaitForForegroundDone = "waitForActiveDone"

  /// Wait for idle was done. App is idle.
  case reportWaitForIdleDone = "waitForIdleDone"

  /// Send to home was done. App is in home screen.
  case reportSendToHomeDone = "sendToHomeDone"

  /// Invoke was done. Contains the result of the invocation.
  case reportInvokeResult = "invokeResult"

  /// Test failed, contains the error message.
  case reportTestFailed = "testFailed"

  /// Capture view hierarchy was done. Contains the view hierarchy path.
  case reportCaptureViewHierarchyDone = "captureViewHierarchyDone"

  /// Shake device was done.
  case reportShakeDeviceDone = "shakeDeviceDone"

  /// App will terminate.
  case reportWillTerminate = "willTerminate"

  /// Recording state was set.
  case reportDidSetRecordingState = "setRecordingStateDone"

  /// App will terminate with error. Contains the error message.
  case reportWillTerminateWithError = "AppWillTerminateWithError"
}
