//
//  XCUIElement+swipe.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

extension XCUIElement {
  /// Swipe from coordinate to another coordinate.
  /// - note XCUITest's implementation for `XCUICoordinate` swiping is not supported on iOS,
  /// and also limited for `XCUIElement` swiping (does not support offset).
  func swipe(
    direction: Action.SwipeDirection,
    speed: Action.ActionSpeed?,
    normalizedOffset: Double?,
    normalizedStartingPointX: Double?,
    normalizedStartingPointY: Double?,
    app: XCUIApplication
  ) {
    let velocity = (speed ?? .slow).gestureVelocity

    if (normalizedOffset == nil && normalizedStartingPointX == nil &&
        normalizedStartingPointY == nil) {
      swipe(direction: direction, velocity: velocity)

      return
    }

    coordinateSwipe(
      direction: direction,
      velocity: velocity,
      normalizedOffset: normalizedOffset,
      normalizedStartingPointX: normalizedStartingPointX,
      normalizedStartingPointY: normalizedStartingPointY,
      app: app
    )
  }

  private func swipe(direction: Action.SwipeDirection, velocity: XCUIGestureVelocity) {
    uiLog("swiping on direction: \(direction)")
    switch direction {
      case .up:
        swipeUp(velocity: velocity)

      case .down:
        swipeDown(velocity: velocity)

      case .left:
        swipeLeft(velocity: velocity)

      case .right:
        swipeRight(velocity: velocity)
    }
  }

  private func coordinateSwipe(
    direction: Action.SwipeDirection,
    velocity: XCUIGestureVelocity,
    normalizedOffset: Double?,
    normalizedStartingPointX: Double?,
    normalizedStartingPointY: Double?,
    app: XCUIApplication
  ) {
    let startCoordinate = coordinate(
      normalizedOffsetX: normalizedStartingPointX,
      normalizedOffsetY: normalizedStartingPointY
    )
    let targetCoordinate = startCoordinate.withOffset(
      makeOffsetVector(normalizedOffset, direction: direction, app: app)
    )

    startCoordinate.press(
      forDuration: 0.02,
      thenDragTo: targetCoordinate,
      withVelocity: velocity,
      thenHoldForDuration: 0
    )
  }

  private func makeOffsetVector(
    _ normalizedOffset: Double?,
    direction: Action.SwipeDirection,
    app: XCUIApplication
  ) -> CGVector {
    let normalizedOffset = normalizedOffset != nil ?
        min(1, max(0, normalizedOffset!)) : defaultNormalizedOffset(app: app)

    switch direction {
      case .up:
        return .init(dx: 0, dy: -normalizedOffset * app.frame.height)

      case .down:
        return .init(dx: 0, dy: normalizedOffset * app.frame.height)

      case .right:
        return .init(dx: normalizedOffset * app.frame.width, dy: 0)

      case .left:
        return .init(dx: -normalizedOffset * app.frame.width, dy: 0)
    }
  }

  private func defaultNormalizedOffset(app: XCUIApplication) -> CGFloat {
    return min(frame.width, frame.height) / max(app.frame.width, app.frame.height)
  }
}
