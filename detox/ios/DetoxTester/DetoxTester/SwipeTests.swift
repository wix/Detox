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

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()
  }

  func testSwipeRight() throws {
    let swipeCell = app.staticTexts["Swipe"]
    XCTAssert(swipeCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: swipeCell, testCase: self)

    let swipableView = app.otherElements.containing(
      .staticText, identifier: "Swipe right").firstMatch
    XCTAssert(swipableView.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

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

  func testCoordinateSwipeRight() throws {
    let swipeCell = app.staticTexts["Swipe"]
    XCTAssert(swipeCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: swipeCell, testCase: self)

    let swipableView = app.otherElements.containing(
      .staticText, identifier: "Swipe right").firstMatch
    XCTAssert(swipableView.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    let swipe = Action.swipe(
      direction: .right,
      speed: .fast,
      normalizedOffset: 0.5,
      normalizedStartingPointX: 0.5,
      normalizedStartingPointY: 0.5
    )
    try actionDelegate.act(action: swipe, on: swipableView, testCase: self)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testSwipeLeft() throws {
    let swipeCell = app.staticTexts["Swipe"]
    XCTAssert(swipeCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: swipeCell, testCase: self)

    let swipableView = app.otherElements.containing(
      .staticText, identifier: "Swipe right").firstMatch
    XCTAssert(swipableView.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

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
