//
//  XCUIApplication+springBoard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension XCUIApplication {
  /// Returns the SpringBoard app.
  static var springBoard: XCUIApplication {
    return XCUIApplication(bundleIdentifier: "com.apple.springboard")
  }
}
