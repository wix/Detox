//
//  XCUIApplication+Common.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Extends `XCUIApplication` with common apps.
extension XCUIApplication {
  /// Returns the settings app.
  static var settingsApp: XCUIApplication {
    return XCUIApplication(bundleIdentifier: .settingsApp)
  }

  /// Returns the SpringBoard app.
  static var springBoard: XCUIApplication {
    return XCUIApplication(bundleIdentifier: .springBoard)
  }

  /// Returns the currently running app.
  static var selectedApp: XCUIApplication {
    let app = XCUIApplication(bundleIdentifier: .selectedApp)

    // Avoid idle resource synchronization within the XCUITest runner
    app.launchEnvironment = ["waitForQuiescence": "NO"]

    return app
  }
}
