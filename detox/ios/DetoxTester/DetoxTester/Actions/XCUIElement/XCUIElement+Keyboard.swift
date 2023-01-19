//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  private var hasKeyboardFocus: Bool {
    return self.value(forKey: "hasKeyboardFocus") as? Bool ?? false
  }

  /// Taps the keyboard key with the given type.
  func tapKey(_ keyType: Action.TapKeyType) throws {
    try self.focusOnElement()

    switch keyType {
      case .returnKey:
        typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  private func focusOnElement() throws {
    if hasKeyboardFocus {
      return
    }

    self.tap()

    guard hasKeyboardFocus else {
      throw Error.failedToFocusKeyboardOnElement
    }
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
    try self.focusOnElement()

    if shouldClearBefore == true {
      guard let currentValue = self.value as? String else {
        throw Error.invalidKeyboardTypeActionNonStringValue
      }

      // TODO: that is a temporal solution.
      for _ in 0...currentValue.count {
        typeText(XCUIKeyboardKey.delete.rawValue)
      }

      // TODO: Unfortunately, on RN, this doensn't work as expected (requires investigation):
//      let clearString = String(
//        repeating: XCUIKeyboardKey.delete.rawValue,
//        count: currentValue.count
//      )
//
//      typeText(clearString)


    }

    guard let text = text else {
      return
    }

    // TODO: Unfortunately, on RN, a simple `typeText(text)` doensn't work as expected. Requires investigation.
    for char in text {
      typeText("\(char)")
    }
  }
}
