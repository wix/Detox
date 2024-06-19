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

  static func appUnderTest() throws -> XCUIApplication {
    guard let bundleId = Environment.bundleID else {
      throw Error.missingBundleId
    }

    return XCUIApplication(bundleIdentifier: bundleId)
  }
}

extension XCUIApplication {
  enum Error: Swift.Error, LocalizedError {
    case missingBundleId

    var errorDescription: String? {
      switch self {
        case .missingBundleId:
          return "Missing bundle-id param in environment variables"
      }
    }
  }
}
