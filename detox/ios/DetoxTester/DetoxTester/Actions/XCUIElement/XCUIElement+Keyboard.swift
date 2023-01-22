//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  public var hasKeyboardFocusOnTextField: Bool {
    return textField.value(forKey: "hasKeyboardFocus") as? Bool ?? false
  }

  private var textField: XCUIElement {
    if let wrappedtextField = textFields.allElementsBoundByIndex.first {
      return wrappedtextField
    }

    return self
  }

  /// Taps the keyboard key with the given type.
  func tapKey(_ keyType: Action.TapKeyType) throws {
    try focusOnTextField()

    switch keyType {
      case .returnKey:
        textField.typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        textField.typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  private func focusOnTextField() throws {
    if hasKeyboardFocusOnTextField {
      return
    }

    let lowerRightCorner = textField.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.9))
    lowerRightCorner.tap()

    guard hasKeyboardFocusOnTextField else {
      throw Error.failedToFocusKeyboardOnElement(element: textField)
    }
  }

  /// Changes the text in the element with the given text and change type.
  func changeText(_ changeType: Action.ChangeTextType, app: XCUIApplication) throws {
    guard textField.value is String else {
      throw Error.invalidKeyboardTypeActionNonStringValue
    }

    switch changeType {
      case .clear:
        try clearText(app: app)

      case .type(let text):
        try addText(text)

      case .replace(let text):
        try pasteText(text, app: app)
    }
  }

  private func clearText(app: XCUIApplication) throws {
    try focusOnTextField()

    textField.tap()

    let selectAll = app.menuItems[localize("Select All")]
    if selectAll.waitForExistence(timeout: 0.5), selectAll.exists {
      selectAll.tap()
      textField.typeText(String(XCUIKeyboardKey.delete.rawValue))
    }
  }

  private func addText(_ text: String) throws {
    try focusOnTextField()

    // TODO: Unfortunately, on RN, a simple `typeText(text)` doensn't work as expected. Requires investigation.
    for char in text {
      textField.typeText("\(char)")
    }
  }

  private func pasteText(_ text: String, app: XCUIApplication) throws {
    UIPasteboard.general.string = text

    try focusOnTextField()

    tap()

    let currentValue = self.value as? String
    if currentValue?.isEmpty == false {
      let selectAll = app.menuItems[localize("Select All")]
      if selectAll.waitForExistence(timeout: 0.5) {
        selectAll.tap()
      } else {
        throw Error.failedToPasteNewText
      }
    }

    let paste = app.menuItems[localize("Paste")]
    if paste.waitForExistence(timeout: 0.5) {
      paste.tap()
    } else {
      throw Error.failedToPasteNewText
    }

    let allowPaste = XCUIApplication.springBoard.alerts.buttons[localize("Allow Paste")]
    if allowPaste.waitForExistence(timeout: 0.5) {
      allowPaste.tap()
    }
  }
}
