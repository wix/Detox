//
//  AppHandlerProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for handling application operations directly from the app itself, in a "gray-box"
/// manner.
protocol AppHandlerProtocol: AnyObject {
  /// Set the target application bundle identifier.
  func setAppUnderTest(bundleIdentifier: String)

  /// Indicates whether the target application supports direct handling.
  func isAppHandlingSupported() -> Bool

  /// Sends a message with given parameters to the application, if able, and synchronically wait for
  /// response.
  ///
  /// If unable to communicate with the application directly, raises an error.
  func send(
    _ type: AppMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) -> AnyHashable
}

/// Type of a web-socket action to be sent from Detox Tester to the application.
enum AppMessageType: String {
  case dummy = "Dummy message type"
}
