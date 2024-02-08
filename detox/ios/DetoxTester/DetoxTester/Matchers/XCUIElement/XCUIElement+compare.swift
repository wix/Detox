//
//  XCUIElement+compare.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  /// Heuristically compare `XCUIElement`s by their properties.
  static func == (lhs: XCUIElement, rhs: XCUIElement) -> Bool {
    return lhs.identifier == rhs.identifier &&
      lhs.frame == rhs.frame &&
      lhs.label == rhs.label &&
      lhs.title == rhs.title &&
      lhs.isEnabled == rhs.isEnabled &&
      lhs.horizontalSizeClass == rhs.horizontalSizeClass &&
      lhs.verticalSizeClass == rhs.verticalSizeClass &&
      lhs.placeholderValue == rhs.placeholderValue &&
      lhs.isSelected == rhs.isSelected &&
      lhs.hasFocus == rhs.hasFocus &&
      lhs.elementType == rhs.elementType &&
      lhs.isHittable == rhs.isHittable &&
      AnyCodable(lhs.value) == AnyCodable(rhs.value)
  }
}
