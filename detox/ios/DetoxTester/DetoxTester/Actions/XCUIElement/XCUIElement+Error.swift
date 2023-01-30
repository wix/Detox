//
//  XCUIElement+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Represents an error caused by `XCUIElement` extensions.
  public enum Error: Swift.Error {
    /// Tried to type text into a non string value.
    case invalidKeyboardTypeActionNonStringValue

    /// Failed to focus on element with the keyboard.
    case failedToFocusKeyboardOnElement(element: XCUIElement)

    /// Failed to paste new text on text input.
    case failedToPasteNewText(onAction: String)
  }
}

extension XCUIElement.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .invalidKeyboardTypeActionNonStringValue:
        return "Cannot type text value into a view without a string value"

      case .failedToFocusKeyboardOnElement(let element):
        return "Failed to focus on element with the keyboard (element " +
            "identifier: `\(element.identifier)`)"

      case .failedToPasteNewText(let onAction):
        return "Failed to paste new text on text input, on action: \(onAction)"
    }
  }
}
