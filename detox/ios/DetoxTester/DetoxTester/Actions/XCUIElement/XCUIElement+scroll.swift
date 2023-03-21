//
//  XCUIElement+scroll.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  /// Scroll a scrollable element to new location based on given scroll `type`.
  ///
  /// - Note: `scroll(byDeltaX: CGFloat, deltaY: CGFloat)` is not supported in iOS, see:
  /// https://developer.apple.com/documentation/xctest/xcuielement/1500758-scroll
  func scroll(_ type: Action.ScrollType, app: XCUIApplication) throws {
    if !isHittable {
      uiLog("scrolling was called, but element is not scrollable", type: .error)
      throw Error.elementNotScrollable(element: self)
    }

    switch type {
      case .to(let edge):
        try scroll(toEdge: edge, app: app)

      case .withParams(
        offset: let offset,
        direction: let direction,
        startNormalizedPositionX: let normalizedPositionX,
        startNormalizedPositionY: let normalizedPositionY
      ):
        try scroll(
          fromNormalizedOffsetX: normalizedPositionX,
          normalizedOffsetY: normalizedPositionY,
          withOffset: offset,
          toDirection: direction,
          app: app
        )
    }
  }

  private func scroll(toEdge edge: Action.ScrollToEdgeType, app: XCUIApplication) throws {
    var lastPNG = screenshot().pngRepresentation
    var count = 0

    while (true) {
      uiLog("swipe #\(count) in direction: \(edge)")
      count += 1

      switch edge {
        case .top:
          swipeDown()

        case .bottom:
          swipeUp()

        case .left:
          swipeRight()

        case .right:
          swipeLeft()
      }

      let newPNG = screenshot().pngRepresentation
      if newPNG == lastPNG {
        if (count == 1) {
          throw Error.elementNotScrollable(element: self)
        }

        return
      }

      lastPNG = newPNG
    }
  }

  private func scroll(
    fromNormalizedOffsetX normalizedOffsetX: Double?,
    normalizedOffsetY: Double?,
    withOffset offset: CGFloat,
    toDirection direction: Action.ScrollDirection,
    app: XCUIApplication
  ) throws {
    let direction = direction.toSwipeDirection()
    let normalizedOffset = normalize(offset, in: direction, app: app)

    let startScreenshot = screenshot().pngRepresentation

    swipe(
      direction: direction,
      speed: .slow,
      normalizedOffset: normalizedOffset,
      normalizedStartingPointX: normalizedOffsetX,
      normalizedStartingPointY: normalizedOffsetY,
      app: app
    )

    let endScreenshot = screenshot().pngRepresentation

    if (startScreenshot == endScreenshot) {
      throw Error.elementNotScrollable(element: self)
    }
  }

  private func normalize(
    _ offset: CGFloat,
    in direction: Action.SwipeDirection,
    app: XCUIApplication
  ) -> CGFloat {
    var fraction: CGFloat!
    switch direction {
      case .up, .down:
        fraction = offset / app.frame.height

      case .right, .left:
        fraction = offset / app.frame.width
    }

    return fraction
  }
}

private extension Action.ScrollDirection {
  func toSwipeDirection() -> Action.SwipeDirection {
    switch self {
      case .up:
        return .down

      case .down:
        return .up

      case .left:
        return .right

      case .right:
        return .left
    }
  }
}
