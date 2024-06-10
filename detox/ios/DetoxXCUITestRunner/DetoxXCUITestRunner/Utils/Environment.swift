//
//  Environment.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

struct Environment {
  private static let environment = ProcessInfo.processInfo.environment
  static let params: String? = environment["PARAMS"]
  static let bundleID: String? = environment["BUNDLE_ID"]
}
