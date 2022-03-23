//
//  XCUIElement+forceTapElement.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  func forceTapElement(
    withNumberOfTaps numberOfTaps: Int
  ) {
    if isHittable {
      self.tap()
      return
    }

    uiLog("element metadata: \(self)")

    let coordinate: XCUICoordinate = self.coordinate(withNormalizedOffset: .zero)
    uiLog("force tapping element: \(self)...")
    coordinate.tap()
    uiLog("force tapped")
  }
}
