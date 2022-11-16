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
  func changeText(_ changeType: Action.ChangeTextType) {
    switch changeType {
      case .clear:
        changeText(nil, shouldClearBefore: true)

      case .type(let text):
        changeText(text, shouldClearBefore: false)

      case .replace(let text):
        changeText(text, shouldClearBefore: true)
    }
  }

  private func changeText(_ text: String?, shouldClearBefore: Bool) {
    self.focusOnElement()

    if shouldClearBefore == true {
      guard let currentValue = self.value as? String else {
        fatalError("Tried to clear and type text into a non string value")
      }

      let clearString = String(repeating: XCUIKeyboardKey.delete.rawValue, count: currentValue.count)
      typeText(clearString)
    }

    guard let text = text else {
      return
    }

    typeText(text)
  }
}
