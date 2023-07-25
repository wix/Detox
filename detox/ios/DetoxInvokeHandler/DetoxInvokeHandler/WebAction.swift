//
//  WebAction.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Represents a user interaction that can be simulated on a web element, if possible.
public enum WebAction: Equatable, Hashable {
  /// Taps the element.
  case tap

  /// Types text on the element.
  case typeText(text: String, isContentEditable: Bool)

  /// Replaces the text on the element.
  case replaceText(text: String)

  /// Clears the text on the element.
  case clearText

  /// Selects all text on the element.
  case selectAllText

  /// Gets the text on the element.
  case getText

  /// Scrolls the element into view.
  case scrollToView

  /// Focuses the element.
  case focus

  /// Moves the cursor to the end of the text on the element.
  case moveCursorToEnd

  /// Runs a script on the element.
  case runScript(script: String)

  /// Runs a script with arguments on the element.
  case runScriptWithArgs(script: String, args: [String])

  /// Gets the current URL.
  ///
  /// - Note: Although this action returns the URL of the presented web document, it can be called
  /// from an inner element only (for example, an iframe id or the HTML) and not from the root
  /// native web view element itself. 
  case getCurrentUrl

  /// Gets the current title.
  case getTitle
}
