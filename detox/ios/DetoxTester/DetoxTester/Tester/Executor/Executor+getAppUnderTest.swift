//
//  Executor+getAppUnderTest.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  /// Returns the app under test bundle identifier.
  public func getAppUnderTestBundleIdentifier() -> String {
    // TODO: get AUT BundleID

    return bundleIdentifier
  }

  /// Returns the app under test.
  func getAppUnderTest() -> XCUIApplication {
    return XCUIApplication(bundleIdentifier: getAppUnderTestBundleIdentifier())
  }
}
