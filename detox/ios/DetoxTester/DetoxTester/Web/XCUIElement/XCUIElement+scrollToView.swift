//
//  XCUIElement+scrollToView.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

/// Extension for scrolling to a view.
extension XCUIElement {
  /// Scrolls to the given view.
  func scrollToView(
    to view: XCUIElement,
    testCase: XCTestCase
  ) throws {
    /// Directions are ordered by priority.
    for direction in [
      SwipeDirection.down,
      SwipeDirection.right,
      SwipeDirection.left,
      SwipeDirection.up
    ] {
      var lastPNG = screenshotData(testCase: testCase)
      var swipeCount = 0
      while (true) {
        if view.isVisible {
          return
        }

        uiLog(
          "element \(String(describing: self)) swipe #\(swipeCount + 1) in direction: \(direction)")

        switch direction {
          case .up:
            swipeUp()

          case .down:
            swipeDown()

          case .left:
            swipeLeft()

          case .right:
            swipeRight()
        }

        let newPNG = screenshotData(testCase: testCase)
        if newPNG == lastPNG {
          // Swipe the opposite direction back:
          for _ in 1...swipeCount {
            switch direction {
              case .up:
                swipeDown()

              case .down:
                swipeUp()

              case .left:
                swipeRight()

              case .right:
                swipeLeft()
            }
          }

          break
        }

        swipeCount += 1
        lastPNG = newPNG
      }
    }


    throw Error.failedToScrollToElement(element: view)
  }
}

extension XCUIElement {
  enum SwipeDirection {
    case up
    case down
    case left
    case right
  }
}
