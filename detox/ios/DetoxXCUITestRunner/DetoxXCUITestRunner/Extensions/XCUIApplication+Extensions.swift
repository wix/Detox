//
//  XCUIApplication+Extensions.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

extension XCUIApplication {
  static var springboard: XCUIApplication {
    return XCUIApplication(bundleIdentifier: "com.apple.springboard")
  }

  static var safari: XCUIApplication {
    return XCUIApplication(bundleIdentifier: "com.apple.mobilesafari")
  }
}
