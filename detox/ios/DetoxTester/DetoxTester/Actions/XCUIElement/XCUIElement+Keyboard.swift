//
//  XCUIElement+Keyboard.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  ///
  public var hasKeyboardFocusOnTextField: Bool {
    return (self.textFields.allElementsBoundByIndex.first(where: { element in
      element.hasKeyboardFocus
    }) != nil) || self.hasKeyboardFocus
  }

  private var hasKeyboardFocus: Bool {
    return self.value(forKey: "hasKeyboardFocus") as? Bool ?? false
  }

  /// Taps the keyboard key with the given type.
  func tapKey(_ keyType: Action.TapKeyType) throws {
    try self.focusKeyboard()

    switch keyType {
      case .returnKey:
        self.typeText(XCUIKeyboardKey.return.rawValue)

      case  .backspaceKey:
        self.typeText(XCUIKeyboardKey.delete.rawValue)
    }
  }

  private func focusKeyboard() throws {
    if self.hasKeyboardFocusOnTextField {
      return
    }

    let lowerRightCorner = self.coordinate(withNormalizedOffset: CGVector(dx: 0.9, dy: 0.9))
    lowerRightCorner.tap()

    guard self.hasKeyboardFocusOnTextField else {
      throw Error.failedToFocusKeyboardOnElement(element: self)
    }
  }

  /// Changes the text in the element with the given text and change type.
  func changeText(_ changeType: Action.ChangeTextType, app: XCUIApplication) throws {
    guard self.value is String else {
      throw Error.invalidKeyboardTypeActionNonStringValue
    }

    switch changeType {
      case .clear:
        try self.deleteText(app: app)

      case .type(let text):
        try self.addText(text)

      case .replace(let text):
        try self.deleteAndPasteText(text, app: app)
    }
  }

  private func deleteText(app: XCUIApplication) throws {
    try self.focusKeyboard()

    self.tap()

    let selectAll = app.menuItems[localize("Select All")]
    if selectAll.waitForExistence(timeout: 0.5), selectAll.exists {
      selectAll.tap()
      self.typeText(String(XCUIKeyboardKey.delete.rawValue))
    }
  }

  private func addText(_ text: String) throws {
    try self.focusKeyboard()

    // TODO: Unfortunately, on RN, a simple `typeText(text)` doensn't work as expected. Requires investigation.
    for char in text {
      self.typeText("\(char)")
    }
  }

  private func deleteAndPasteText(_ text: String, app: XCUIApplication) throws {
    UIPasteboard.general.string = text

    try self.focusKeyboard()

    self.tap()

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
