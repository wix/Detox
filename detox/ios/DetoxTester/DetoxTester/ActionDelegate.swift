//
//  ActionDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxMessageHandler
import XCTest

class ActionDelegate: ActionDelegateProtocol {
  func act(action: Action, on element: AnyHashable) throws {
    guard let element = element as? XCUIElement else {
      throw ActionDelegateError.notXCUIElement
    }

    switch action {
      case .tap:
        element.tap()

      case .tapOnAxis(let x, let y):
        let dx = Double(x) / element.frame.width
        let dy = Double(y) / element.frame.height
        element.coordinate(withNormalizedOffset: CGVector(dx: dx, dy: dy)).tap()

      case .longPress:
        element.press(forDuration: 0.7)

      case .longPressAndDrag(
        let duration, let normalizedPositionX, let normalizedPositionY, let targetElement,
        let normalizedTargetPositionX, let normalizedTargetPositionY, let speed, let holdDuration):

        let targetXCUIElement = targetElement as? XCUIElement
        if (targetXCUIElement != nil) {
          element.press(forDuration: duration ?? 0.7, thenDragTo: targetXCUIElement!,
                        withVelocity: speed ?? 1 > 0.5 ? .fast : .slow,
                        thenHoldForDuration: holdDuration ?? 0.1)
        } else {
          element.press(forDuration: duration ?? 0.7)
        }

      case .swipe(let direction, let speed, let normalizedOffset, let normalizedStartingPointX,
                  let normalizedStartingPointY):
        element.swipeUp(velocity: .fast)

      case .screenshot(let imageName):
        element.screenshot() // need to implement full functionality with image name
    }
  }

  let app = XCUIApplication(bundleIdentifier: "com.wix.APP")
  app.waitForExistence(timeout: 20000)
  app.activate
}

extension ActionDelegate {
  enum ActionDelegateError: Error {
    case notXCUIElement
  }
}

