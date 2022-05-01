//
//  ElementMatcher.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ElementMatcher: ElementMatcherProtocol {
  let app: XCUIApplication

  init(_ app: XCUIApplication) {
    self.app = app
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    matcherLog("called to match with pattern: \(pattern)")
    return app.newQuery().matching(pattern: pattern).run()
  }
}
