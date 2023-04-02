//
//  XCUIElement+cleanIdentifier.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Removes `_detox:<UUID>` postfix from a given `identifier`.
func removeDetoxPostfix(from identifier: String) -> String {
  let postfixRegex = try? NSRegularExpression(pattern: "_detox.*", options: .caseInsensitive)
  let cleanIdentifier = postfixRegex!.stringByReplacingMatches(
    in: identifier, range: NSMakeRange(0, identifier.count), withTemplate: "")

  return cleanIdentifier
}

extension XCUIElement {
  /// Returns a clean identifier of the element without Detox's postfix.
  var cleanIdentifier: String {
    return removeDetoxPostfix(from: identifier)
  }
}
