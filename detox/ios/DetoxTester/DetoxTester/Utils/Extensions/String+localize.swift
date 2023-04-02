//
//  String+localize.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Extends `String` with a method to localize a string with the UITest bundle.
extension String {
  /// Localize string with the main bundle.
  func localize() -> String {
    return NSLocalizedString(self, value: self, comment: "")
  }
}

/// Localize the given string using the main bundle.
func localize(_ toLocalize: String) -> String {
  return toLocalize.localize()
}
