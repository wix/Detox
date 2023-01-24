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
  func scroll(_ type: Action.ScrollType, app: XCUIApplication) {
    switch type {
      case .to(let edge):
        scroll(toEdge: edge, app: app)

      case .withParams(
        offset: let offset,
        direction: let direction,
        startNormalizedPositionX: let normalizedPositionX,
        startNormalizedPositionY: let normalizedPositionY
      ):
        scroll(
          fromNormalizedOffsetX: normalizedPositionX,
          normalizedOffsetY: normalizedPositionY,
          withOffset: offset,
          toDirection: direction,
          app: app
        )
    }
  }

  private func scroll(toEdge edge: Action.ScrollToEdgeType, app: XCUIApplication) {
    var lastPNG = screenshot().pngRepresentation
    while (true) {
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
  ) {
    let direction = direction.toSwipeDirection()
    let normalizedOffset = normalize(offset, in: direction, app: app)

    swipe(
      direction: direction,
      speed: .slow,
      normalizedOffset: normalizedOffset,
      normalizedStartingPointX: normalizedOffsetX,
      normalizedStartingPointY: normalizedOffsetY,
      app: app
    )
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
        return .left

      case .right:
        return .right
    }
  }
}
