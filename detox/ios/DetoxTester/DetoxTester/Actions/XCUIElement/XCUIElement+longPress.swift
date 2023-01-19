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
    dragTo target: XCUIElement,
    normalizedTargetOffsetX: Double?,
    normalizedTargetOffsetY: Double?,
    speed: Action.ActionSpeed?,
    holdDuration: Double?,
    testCase: XCTestCase
  ) throws {
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
}

extension XCUICoordinate {
  func longPress(duration: TimeInterval) {
    self.press(forDuration: duration)
  }
}