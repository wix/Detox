//
//  ActionDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ActionDelegate: ActionDelegateProtocol {
  func act(action: Action, on element: AnyHashable) throws {
    guard let element = element as? XCUIElement else {
      throw ActionDelegateError.notXCUIElement
    }

    uiLog("handling action: `\(action)`, on element: `\(element)`")

    switch action {
      case .tap(let times):
        uiLog("taps on: `\(element)`, times: \(times)")
        uiLog("- exists: \(element.exists)")
        uiLog("- hittable: \(element.isHittable)")
//        uiLog("- enabled: \(element.isEnabled)")
        uiLog("- frame: \(element.frame)")
        uiLog("- elementType: \(element.elementType)")
        uiLog("- label: \(element.label)")
        uiLog("- title: \(element.title)")
        uiLog("- identifier: \(element.identifier)")


        element.forceTapElement(withNumberOfTaps: Int(times))
        uiLog("tap done")

      case .tapOnAxis(let x, let y):
        let dx = Double(x) / element.frame.width
        let dy = Double(y) / element.frame.height
        element.coordinate(withNormalizedOffset: CGVector(dx: dx, dy: dy)).tap()

      case .longPress:
        element.press(forDuration: 0.7)

      case .longPressAndDrag(
        let duration, let normalizedPositionX, let normalizedPositionY, let targetElement,
        let normalizedTargetPositionX, let normalizedTargetPositionY, let speed, let holdDuration):
        fatalError("not implmented yet")

      case .swipe(let direction, let speed, let normalizedOffset, let normalizedStartingPointX,
                  let normalizedStartingPointY):
        element.swipeUp(velocity: .fast)

      case .screenshot(let imageName):
        element.screenshot() // need to implement full functionality with image name
      case .getAttributes:
        fatalError("not implmented yet")
      case .tapKey(_):
        fatalError("not implmented yet")
      case .changeText(_):
        fatalError("not implmented yet")
      case .scroll(_):
        fatalError("not implmented yet")
      case .setColumnToValue(index: let index, value: let value):
        fatalError("not implmented yet")
      case .setDatePicker(date: _):
        fatalError("not implmented yet")
      case .pinch(scale: let scale_, speed: let speed_, angle: let angle_):
        fatalError("not implmented yet")
      case .adjustSlider(normalizedPosition: let normalizedPosition):
        fatalError("not implmented yet")
    }
  }

  func getAttributes(from elements: [AnyHashable]) throws -> AnyCodable {
    fatalError("not implmented yet")
  }
}

extension ActionDelegate {
  enum ActionDelegateError: Error {
    case notXCUIElement
  }
}

