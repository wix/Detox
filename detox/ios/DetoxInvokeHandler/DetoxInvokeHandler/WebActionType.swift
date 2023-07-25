//
//  WebActionType.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Representation of interaction with a web element.
public enum WebActionType: String, Codable, Equatable {
  /// Tap on element.
  case tap = "tap"

  /// Type text into element.
  case typeText = "typeText"

  /// Replace text of element.
  case replaceText = "replaceText"

  /// Clear element's text.
  case clearText = "clearText"

  /// Select all text of element.
  case selectAllText = "selectAllText"

  /// Get text of element.
  case getText = "getText"

  /// Scroll element into view.
  case scrollToView = "scrollToView"

  /// Focus element.
  case focus = "focus"

  /// Move cursor to end of text of element.
  case moveCursorToEnd = "moveCursorToEnd"

  /// Run script on element.
  case runScript = "runScript"

  /// Run script with arguments on element.
  case runScriptWithArgs = "runScriptWithArgs"

  /// Get current URL.
  ///
  /// - Note: Although this action returns the URL of the presented web document, it can be called
  /// from an inner element only (for example, an iframe id or the HTML) and not from the root
  /// native web view element itself.
  case getCurrentUrl = "getCurrentUrl"

  /// Get current title.
  case getTitle = "getTitle"
}
