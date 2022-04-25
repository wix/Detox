//
//  XCUIElement+coordinate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Default normalized offset (both axis).
  static let defaultNormalizedOffset = 0.5

  ///
  func coordinate(
    normalizedOffsetX: Double?,
    normalizedOffsetY: Double?
  ) -> XCUICoordinate {
    return coordinate(
      withNormalizedOffset: .init(
        dx: normalizedOffsetX ?? XCUIElement.defaultNormalizedOffset,
        dy: normalizedOffsetY ?? XCUIElement.defaultNormalizedOffset
      )
    )
  }
}
