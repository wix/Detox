//
//  XCUIElement+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension XCUIElement {
  /// Represents an error caused by `XCUIElement` extensions.
  public enum Error: Swift.Error {
    /// Tried to type text into a non string value.
    case invalidKeyboardTypeActionNonStringValue

    /// Failed to focus on element with the keyboard.
    case failedToFocusKeyboardOnElement

    /// Failed to paste new text on text input.
    case failedToPasteNewText
  }
}

extension XCUIElement.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .invalidKeyboardTypeActionNonStringValue:
        return "Cannot type text value into a view without a string value"

      case .failedToFocusKeyboardOnElement:
        return "Failed to focus on element with the keyboard"

      case .failedToPasteNewText:
        return "Failed to paste new text on text input"
    }
  }
}
