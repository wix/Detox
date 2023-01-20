//
//  String+BundleIdentifiers.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

///
extension String {
  ///
  static var springBoard: String { return "com.apple.springboard" }

  ///
  static var settingsApp: String { return "com.apple.Preferences" }

  ///
  static var appUnderTest: String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.appUnderTest] ?? "com.wix.DetoxTesterApp"
  }
}
