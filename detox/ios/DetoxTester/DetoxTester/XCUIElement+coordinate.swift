//
//  XCUIElement+coordinate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  func coordinate(
    normalizedOffsetX: Double?,
    normalizedOffsetY: Double?
  ) -> XCUICoordinate {
    return coordinate(
      withNormalizedOffset: .init(dx: normalizedOffsetX ?? 0.5, dy: normalizedOffsetY ?? 0.5)
    )
  }
}
