//
//  XCUIElement+query.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Returns a new query on the element's descendants.
  func newQuery() -> XCUIElementQuery {
    return descendants(matching: .any)
  }
}
