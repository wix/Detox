//
//  XCUIElement+tap.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Taps on element multiple times.
  func tap(withNumberOfTaps numberOfTaps: Int) throws {
    uiLog("requested tap on: `\(self)`, number of taps: \(numberOfTaps)")

    guard self.isHittable else {
      uiLog("\(self) is not hittable", type: .error)
      throw Error.elementNotHittable(element: self)
    }

    if numberOfTaps == 1 {
      tap()
    } else {

      // TODO: this call is not working as expected on React Native apps.
      // `tap(withNumberOfTaps: numberOfTaps, numberOfTouches: 1)`

      for tapTime in 1...numberOfTaps {
        uiLog("tapping on \(self), \(tapTime)/\(numberOfTaps) taps")

        guard self.isHittable else {
          uiLog("\(self) is no longer hittable", type: .error)
          throw Error.elementNotHittable(element: self)
        }

        shortPress()
      }
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
