//
//  XCUIElementQuery+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import DetoxInvokeHandler
import XCTest

extension XCUIElementQuery {
  /// Represents an error caused by `XCUIElementQuery` extensions.
  public enum Error: Swift.Error {
    /// Cannot match by a pattern type using the XCUITest framework (running without white-box
    /// access).
    case cannotMatchByPattern(pattern: ElementPattern)
  }
}
