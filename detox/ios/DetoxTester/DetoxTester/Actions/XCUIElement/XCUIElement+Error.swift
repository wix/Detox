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
  }
}
