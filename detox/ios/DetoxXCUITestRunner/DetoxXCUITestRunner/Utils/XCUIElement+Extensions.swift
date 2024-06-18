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
    let content = value as? String ?? ""
    let shouldSkipFocus = hasKeyboardFocus && content.count == 0

    if (!shouldSkipFocus) {
      let end = coordinate(withNormalizedOffset: CGVector(dx: 0.7, dy: 0.5))
      end.tap()
    }

    typeText(text)
  }

  public func clearText() {
    guard var content = value as? String else {
      XCTFail("The text field does not contain a string value.")
      return
    }

    while content.count > 0 {
      let deleteString = String(repeating: "\u{8}", count: content.count)
      typeText(deleteString)

      let newContent = value as? String ?? ""

      if (newContent == content) {
        break
      } else {
        content = newContent
      }
    }
  }
}

extension XCUIElement {
  var hasKeyboardFocus: Bool {
    return (self.value(forKey: "hasKeyboardFocus") as? Bool) ?? false
  }
}
