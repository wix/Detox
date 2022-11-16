//
//  Executor+getAppUnderTest.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  /// Returns the app under test bundle identifier.
  func getAppUnderTestBundleIdentifier() -> String {
    let environment = ProcessInfo.processInfo.environment
    guard let bundleIdentifier = environment[EnvArgKeys.appUnderTest] else {
      execLog("app under test is undefined", type: .error)
      fatalError("app under test is undefined")
    }

    return bundleIdentifier
  }

  /// Returns the app under test.
  func getAppUnderTest() -> XCUIApplication {
    return XCUIApplication(bundleIdentifier: getAppUnderTestBundleIdentifier())
  }
}
