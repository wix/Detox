//
//  XCUIElement+pinch.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  ///
  func pinch(withScale scale: Double, speed: Action.ActionSpeed?, angle: Double?) {
    let angle = radians(from: angle ?? 0)
    rotate(angle, withVelocity: rotateVelocity(fromSpeed: speed, angle: angle))
    pinch(withScale: scale, velocity: pinchVelocity(fromSpeed: speed, scale: scale))
  }

  private func pinchVelocity(fromSpeed speed: Action.ActionSpeed?, scale: Double) -> Double {
    let sign: Double = scale < 1 ? -1 : 1

    if speed == .fast {
      return sign * 1
    }
    return sign * 0.5
  }

  private func rotateVelocity(fromSpeed speed: Action.ActionSpeed?, angle: Double) -> Double {
    let sign: Double = angle > 0 ? 1 : -1

    if speed == .fast {
      return sign * 2 * .pi
    }
    return sign * .pi
  }

  private func radians(from degree: Double) -> Double {
    return (degree / 180) * .pi
  }
}
