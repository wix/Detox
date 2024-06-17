//
//  XCUIElement+Keyboard.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

extension XCUIElement {
  public func replaceText(_ text: String) {
    clearText()
    typeTextOnEnd(text)
  }

  public func typeTextOnEnd(_ text: String) {
    let end = coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5))
    end.tap()

    typeText(text)
  }

  public func clearText() {
    tap()

    // Select all text by tapping and holding, then dragging to select all
    let start = coordinate(withNormalizedOffset: CGVector(dx: 0, dy: 0))
    let end = coordinate(withNormalizedOffset: CGVector(dx: 1, dy: 0))
    start.press(forDuration: 1.5, thenDragTo: end)

    typeText(XCUIKeyboardKey.delete.rawValue)
  }
}
