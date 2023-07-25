//
//  WebExpectationType.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Representation of a web element expectation.
public enum WebExpectationType: String, Codable, Equatable {
  /// Expects the element to have a specified text.
  case toHaveText = "toHaveText"

  /// Expects the element to exist on the web-view element.
  case toExist = "toExist"
}
