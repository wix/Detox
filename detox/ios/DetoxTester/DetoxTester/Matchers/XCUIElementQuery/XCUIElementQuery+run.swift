//
//  XCUIElementQuery+run.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElementQuery {
  /// Returns all elements evaluated by this query.
  func run() -> [XCUIElement] {
    matcherLog("runs matching with `allElementsBoundByIndex`")
    return allElementsBoundByIndex
  }
}
