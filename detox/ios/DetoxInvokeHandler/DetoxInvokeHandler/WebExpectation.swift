//
//  WebExpectation.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Represents a state expectation of a web element.
public enum WebExpectation: Equatable {
  /// Expects the view's text to equal the given `text`.
  case toHaveText(_ text: String)

  /// Expects the element to exist within the web-view element.
  case toExist
}
