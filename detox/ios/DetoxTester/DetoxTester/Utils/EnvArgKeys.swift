//
//  EnvArgKeys.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Environment arguments keys for Detox Tester.
@objcMembers class EnvArgKeys: NSObject {
  /// Environment argument key for accessing the information whether Detox Server is active.
  static let isDetoxActive = "IS_DETOX_ACTIVE"

  /// Environment argument key for accessing the Detox Server URL of the current tests execution.
  static let detoxServer = "DETOX_SERVER"

  /// Environment argument key for accessing the session identifier of the current tests execution.
  static let detoxSessionId = "DETOX_SESSION_ID"

  /// Environment argument key for accessing the port of the test target server.
  static let testTargetServerPort = "TEST_TARGET_SERVER_PORT"

  /// Environment argument key for accessing the bundle identifier of the running app.
  static let bundleId = "BUNDLE_ID"
}
