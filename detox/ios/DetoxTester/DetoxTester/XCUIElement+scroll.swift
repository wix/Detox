//
//  XCUIElement+scroll.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement {
  ///
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
    switch edge {
      case .top:
        scroll(byDeltaX: 0, deltaY: -frame.origin.y)

      case .bottom:
        scroll(byDeltaX: 0, deltaY: frame.origin.y)

      case .left:
        scroll(byDeltaX: -frame.origin.x, deltaY: 0)

      case .right:
        scroll(byDeltaX: frame.origin.x, deltaY: 0)
    }
  }

  private func scroll(
    fromNormalizedOffsetX normalizedOffsetX: Double?,
    normalizedOffsetY: Double?,
    withOffset offset: CGFloat,
    toDirection direction: Action.ScrollToEdgeType,
    app: XCUIApplication
  ) {
    let coordinate = coordinate(
      normalizedOffsetX: normalizedOffsetX,
      normalizedOffsetY: normalizedOffsetY
    )

    switch direction {
      case .top:
        coordinate.scroll(byDeltaX: 0, deltaY: -offset)

      case .bottom:
        coordinate.scroll(byDeltaX: 0, deltaY: offset)

      case .left:
        coordinate.scroll(byDeltaX: -offset, deltaY: 0)

      case .right:
        coordinate.scroll(byDeltaX: offset, deltaY: 0)
    }
  }
}
