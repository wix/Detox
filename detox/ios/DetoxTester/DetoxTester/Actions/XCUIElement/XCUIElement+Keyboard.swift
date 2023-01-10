//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  /// Taps the keyboard key with the given type.
  func tapKey(_ keyType: Action.TapKeyType) throws {
    self.focusOnElement()

    switch keyType {
      case .returnKey:
        typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  private func focusOnElement() {
    let hasFocus = self.value(forKey: "hasKeyboardFocus") as? Bool ?? false
    if hasFocus {
      return
    }

    self.tap()
  }

  /// Changes the text in the element with the given text and change type.
  func changeText(_ changeType: Action.ChangeTextType) throws {
    switch changeType {
      case .clear:
        try changeText(nil, shouldClearBefore: true)

      case .type(let text):
        try changeText(text, shouldClearBefore: false)

      case .replace(let text):
        try changeText(text, shouldClearBefore: true)
    }
  }

  private func changeText(_ text: String?, shouldClearBefore: Bool) throws {
    self.focusOnElement()

    if shouldClearBefore == true {
      guard let currentValue = self.value as? String else {
        throw Error.invalidKeyboardTypeActionNonStringValue
      }

      let clearString = String(
        repeating: XCUIKeyboardKey.delete.rawValue,
        count: currentValue.count
      )

      typeText(clearString)
    }

    guard let text = text else {
      return
    }

    typeText(text)
  }
}
