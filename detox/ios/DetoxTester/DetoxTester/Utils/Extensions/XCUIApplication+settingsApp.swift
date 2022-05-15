//
//  XCUIApplication+settingsApp.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension XCUIApplication {
  ///
  static var settingsApp: XCUIApplication {
    return XCUIApplication(bundleIdentifier: "com.apple.Preferences")
  }
}
