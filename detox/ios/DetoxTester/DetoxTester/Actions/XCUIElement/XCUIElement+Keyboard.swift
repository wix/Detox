//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  ///
  func tapKey(_ keyType: Action.TapKeyType) throws {
    if !self.hasFocus {
      self.tap()
    }

    switch keyType {
      case .returnKey:
        typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  ///
  func changeText(_ changeType: Action.ChangeTextType) {
    if !self.hasFocus {
      self.tap()
    }

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
    if !self.hasFocus {
      self.tap()
    }

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
