//
//  XCUIElement+compare.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  static func == (lhs: XCUIElement, rhs: XCUIElement) -> Bool {
    return lhs.identifier == rhs.identifier &&
      lhs.frame == rhs.frame &&
    lhs.elementType == rhs.elementType &&
    lhs.isHittable == rhs.isHittable &&
    AnyCodable(lhs.value) == AnyCodable(rhs.value)
  }
}
