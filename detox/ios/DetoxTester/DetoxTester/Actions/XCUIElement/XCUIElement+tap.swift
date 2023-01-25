//
//  XCUIElement+tap.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Taps on element multiple times.
  func tap(withNumberOfTaps numberOfTaps: Int) {
    uiLog("requested tap on: `\(self)`, number of taps: \(numberOfTaps)")

    if numberOfTaps == 1 {
      tap()
      return
    }

    // TODO: this call is not working as expected on React Native apps.
    // `tap(withNumberOfTaps: numberOfTaps, numberOfTouches: 1)`

    for tapTime in 1...numberOfTaps {
      uiLog("tapping on \(self), \(tapTime)/\(numberOfTaps) taps")

      guard self.isHittable else {
        uiLog("\(self) is no longer hittable", type: .error)
        return
      }

      shortPress()
    }

    uiLog("\(self) tapped")
  }

  /// Taps on given `point` of element.
  func tap(on point: CGPoint) {
    uiLog("requested tap on: `\(self)`, in point: \(point)")

    let dx = point.x / frame.width
    let dy = point.y / frame.height
    coordinate(withNormalizedOffset: CGVector(dx: dx, dy: dy)).tap()

    uiLog("`\(self)` tapped")
  }
}
