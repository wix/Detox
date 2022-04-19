//
//  XCUIElement+longPress.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

extension XCUIElement {
  /// Long press on the element.
  func longPress(_ duration: TimeInterval = 0.7) {
    self.press(forDuration: duration)
  }

  /// Long press and drag the element with given parameters.
  func longPress(
    duration: Double,
    normalizedOffsetX: Double?,
    normalizedOffsetY: Double?,
    dragTo target: AnyHashable,
    normalizedTargetOffsetX: Double?,
    normalizedTargetOffsetY: Double?,
    speed: Action.ActionSpeed?,
    holdDuration: Double?,
    testCase: XCTestCase
  ) throws {
    guard let target = target as? XCUIElement else {
      throw ActionDelegate.ActionDelegateError.notXCUIElement
    }

    let velocity = speed?.gestureVelocity ?? .default
    let holdSeconds = (holdDuration ?? 1000) / 1000

    if (normalizedOffsetX == nil || normalizedOffsetY == nil) &&
        (normalizedTargetOffsetX == nil || normalizedTargetOffsetY == nil) {
      press(
        forDuration: duration,
        thenDragTo: target,
        withVelocity: velocity,
        thenHoldForDuration: holdSeconds
      )
      return
    }

    let startCoordinate = coordinate(
      normalizedOffsetX: normalizedOffsetX,
      normalizedOffsetY: normalizedOffsetY
    )

    let endCoordinate = target.coordinate(
      normalizedOffsetX: normalizedOffsetX,
      normalizedOffsetY: normalizedOffsetY
    )

    startCoordinate.press(
      forDuration: duration,
      thenDragTo: endCoordinate,
      withVelocity: velocity,
      thenHoldForDuration: holdSeconds
    )
  }

  private func coordinate(
    normalizedOffsetX: Double?,
    normalizedOffsetY: Double?
  ) -> XCUICoordinate {
    guard
      let normalizedOffsetX = normalizedOffsetX,
      let normalizedOffsetY = normalizedOffsetY
    else {
      return coordinate(normalizedOffsetX: 0.5, normalizedOffsetY: 0.5)
    }

    return coordinate(
      withNormalizedOffset: .init(dx: normalizedOffsetX, dy: normalizedOffsetY)
    )
  }
}

extension XCUICoordinate {
  func longPress(duration: TimeInterval) {
    self.press(forDuration: duration)
  }
}
