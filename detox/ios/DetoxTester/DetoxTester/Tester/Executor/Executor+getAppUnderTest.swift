//
//  Executor+getAppUnderTest.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func getAppUnderTest() -> XCUIApplication {
    let environment = ProcessInfo.processInfo.environment
    guard let bundleIdentifier = environment[EnvArgKeys.appUnderTest] else {
      execLog("app under test is undefined", type: .error)
      fatalError("app under test is undefined")
    }

    return XCUIApplication(bundleIdentifier: bundleIdentifier)
  }
}
