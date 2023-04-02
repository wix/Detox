//
//  SwipeTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class SwipeTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var swipableView: XCUIElement!
  var resultLabel: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let swipeCell = app.staticTexts["Swipe"]
    XCTAssert(swipeCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: swipeCell, testCase: self)

    swipableView = app.otherElements.containing(.staticText, identifier: "Swipe right").firstMatch
    XCTAssert(swipableView.waitForExistence(timeout: 30))

    resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")
  }

  func testSwipeRight() throws {
    let swipe = Action.swipe(
      direction: .right,
      speed: .fast,
      normalizedOffset: nil,
      normalizedStartingPointX: nil,
      normalizedStartingPointY: nil
    )

    try actionDelegate.act(action: swipe, on: swipableView, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testCoordinateSwipeRight_1() throws {
    let swipe = Action.swipe(
      direction: .right,
      speed: .slow,
      normalizedOffset: 0.5,
      normalizedStartingPointX: 0.5,
      normalizedStartingPointY: 0.5
    )

    try actionDelegate.act(action: swipe, on: swipableView, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testCoordinateSwipeRight_2() throws {
    let swipe = Action.swipe(
      direction: .right,
      speed: .fast,
      normalizedOffset: 0.3,
      normalizedStartingPointX: 0.3,
      normalizedStartingPointY: 0.3
    )

    try actionDelegate.act(action: swipe, on: swipableView, testCase: self)

    XCTAssertNotEqual(resultLabel.label, "Success!")
  }

  func testSwipeLeft() throws {
    let swipe = Action.swipe(
      direction: .left,
      speed: .fast,
      normalizedOffset: nil,
      normalizedStartingPointX: nil,
      normalizedStartingPointY: nil
    )

    try actionDelegate.act(action: swipe, on: swipableView, testCase: self)

    XCTAssertNotEqual(resultLabel.label, "Success!")
  }
}
