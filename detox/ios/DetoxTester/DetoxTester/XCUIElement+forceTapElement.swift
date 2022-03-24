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
      uiLog("tapping: \(self)...")
      self.tap()
      return
    }

    uiLog("element is not tappable: \(self), force tapping..")

    let coordinate: XCUICoordinate = self.coordinate(withNormalizedOffset: .zero)
    coordinate.tap()
    uiLog("force tapped!")
  }
}
