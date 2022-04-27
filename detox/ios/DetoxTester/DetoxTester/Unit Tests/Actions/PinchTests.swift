//
//  PinchTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class PinchTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var pinchView: XCUIElement!
  var originalSize: CGSize!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()

    let pinchCell = app.staticTexts["Pinch"]
    XCTAssert(pinchCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: pinchCell, testCase: self)

    pinchView = app.images["pinchView"]

    XCTAssert(pinchView.waitForExistence(timeout: 30))
    originalSize = pinchView.frame.size
  }

  func testSlowPinchWithoutAngle() throws {
    let action = Action.pinch(scale: 0.5, speed: .slow, angle: nil)

    try actionDelegate.act(action: action, on: pinchView, testCase: self)

    XCTAssertLessThan(pinchView.frame.size.width, originalSize.width)
    XCTAssertLessThan(pinchView.frame.size.height, originalSize.height)
  }

  func testFastPinchWithAngle() throws {
    let action = Action.pinch(scale: 1.5, speed: .fast, angle: 90)

    try actionDelegate.act(action: action, on: pinchView, testCase: self)

    XCTAssertGreaterThan(pinchView.frame.size.width, originalSize.width)
    XCTAssertGreaterThan(pinchView.frame.size.height, originalSize.height)
  }

  func testFastRotateWithNegativeAngle() throws {
    let action = Action.pinch(scale: 1.5, speed: .fast, angle: -180)

    try actionDelegate.act(action: action, on: pinchView, testCase: self)

    XCTAssertGreaterThan(pinchView.frame.size.width, originalSize.width)
    XCTAssertGreaterThan(pinchView.frame.size.height, originalSize.height)
  }
}
