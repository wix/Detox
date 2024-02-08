//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

/// Extends `XCUIElement` with keyboard actions.
extension XCUIElement {
  /// Indicates whether the text field element has keyboard focus.
  func hasKeyboardFocusOnTextField(_ whiteBoxMessageHandler: WhiteBoxMessageHandler) -> Bool {
    let textField = textField ?? self
    if (textField.hasKeyboardFocus || textField.hasFocus) {
      return true
    }

    let message = WhiteBoxExecutor.Message.isFocused(element: textField)
    guard let response = whiteBoxMessageHandler(message) else {
      fatalError("Is-focused check is not supported by the XCUITest target")
    }

    guard case .boolean(let isFocusedOnWhiteBox) = response else {
      return false
    }

    return isFocusedOnWhiteBox
  }

  public var hasKeyboardFocus: Bool {
    return value(forKey: "hasKeyboardFocus") as? Bool ?? false
  }

  private var textField: XCUIElement? {
    return textFields.run().first
  }

  /// Taps the keyboard key with the given type.
  func tapKey(
    _ keyType: Action.TapKeyType,
    _ whiteBoxMessageHandler: WhiteBoxMessageHandler
  ) throws {
    try focusKeyboard(whiteBoxMessageHandler)

    switch keyType {
      case .returnKey:
        typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  /// Focuses the keyboard on the element.
  func focusKeyboard(_ whiteBoxMessageHandler: WhiteBoxMessageHandler) throws {
    if hasKeyboardFocusOnTextField(whiteBoxMessageHandler) == true {
      return
    }

    shortPressOnCorner()

    guard hasKeyboardFocusOnTextField(whiteBoxMessageHandler) == true else {
      throw Error.failedToFocusKeyboardOnElement(element: self)
    }
  }

  private func shortPressOnCorner() {
    coordinate(
      withNormalizedOffset: CGVector(dx: 0.9, dy: 0.9)
    ).shortPress()
  }

  private func longPressOnCorner() {
    coordinate(
      withNormalizedOffset: CGVector(dx: 0.9, dy: 0.9)
    ).longPress(duration: 0.6)
  }

  /// Changes the text in the element with the given text and change type.
  func changeText(
    _ changeType: Action.ChangeTextType,
    app: XCUIApplication,
    whiteBoxMessageHandler: WhiteBoxMessageHandler
  ) throws {
    if let textField = textField {
      uiLog("found underlying text field, changing text on the text field (\(textField)")
      try textField.changeText(changeType, app: app, whiteBoxMessageHandler: whiteBoxMessageHandler)
      return
    }

    guard value is String else {
      throw Error.invalidKeyboardTypeActionNonStringValue
    }

    switch changeType {
      case .clear:
        try replaceText("", app: app)

      case .type(let text):
        try addText(text, whiteBoxMessageHandler: whiteBoxMessageHandler)

      case .replace(let text):
        try replaceText(text, app: app)
    }
  }

  /// Selects all text in the element.
  func selectAllText(app: XCUIApplication, completion: (() -> Void)?) throws {
    longPressOnCorner()
    uiLog("long-pressed on element's corner: `\(self.cleanIdentifier)`", type: .debug)

    if (tapOnSelectAllIfPresent(app: app)) {
      uiLog("did select all text on element `\(self.cleanIdentifier)`", type: .debug)
    } else {
      uiLog("nothing to select on element `\(self.cleanIdentifier)`", type: .debug)
    }

    completion?()
  }

  private func addText(_ text: String, whiteBoxMessageHandler: WhiteBoxMessageHandler) throws {
    try focusKeyboard(whiteBoxMessageHandler)

    typeText(text)
  }

  private func replaceText(_ text: String, app: XCUIApplication) throws {
    UIPasteboard.general.string = text

    try selectAllText(app: app) {
      uiLog("text selected before pasting new text", type: .debug)
    }

    try tapOnPasteText(app: app, completion: pressOnAllowPaste)
  }

  private func tapOnSelectAllIfPresent(app: XCUIApplication) -> Bool {
    let selectAll = app.menuItems[localize("Select All")]
    if selectAll.waitForExistence(timeout: 0.5) {
      selectAll.tap()
      return true
    }

    return false
  }

  private func tapOnPasteText(app: XCUIApplication, completion: () -> Void) throws {
    let paste = app.menuItems[localize("Paste")]
    if paste.waitForExistence(timeout: 0.5) {
      paste.tap()
      completion()
    } else {
      throw Error.failedToPasteNewText(onAction: "paste")
    }
  }

  private func pressOnAllowPaste() {
    let allowPaste = XCUIApplication.springBoard.alerts.buttons[localize("Allow Paste")]
    if allowPaste.waitForExistence(timeout: 0.5) {
      allowPaste.tap()
    }
  }
}
