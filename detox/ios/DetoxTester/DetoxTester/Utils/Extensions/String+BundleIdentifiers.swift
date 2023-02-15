//
//  String+BundleIdentifiers.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Bundle identifiers for commonly used apps.
extension String {
  /// Bundle identifier of the Preferences app (Settings).
  static var settingsApp: String { return "com.apple.Preferences" }

  /// Bundle identifier for the SpringBoard app (iOS Home)
  static var springBoard: String { return "com.apple.springboard" }

  /// Bundle identifier for the currently running app.
  static var selectedApp: String {
    return ProcessInfo.processInfo.environment[EnvArgKeys.bundleId]!;
  }
}
