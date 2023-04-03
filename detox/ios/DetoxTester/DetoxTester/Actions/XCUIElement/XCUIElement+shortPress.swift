//
//  XCUIElement+shortPress.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Short press on the element.
  func shortPress() {
    self.press(forDuration: 0.1)
  }
}

extension XCUICoordinate {
  /// Short press on the coordinate.
  func shortPress() {
    self.press(forDuration: 0.1)
  }
}
