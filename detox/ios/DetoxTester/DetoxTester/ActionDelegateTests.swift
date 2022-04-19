//
//  ActionDelegateTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ActionDelegateTests: DTXTestCase {
  let app = XCUIApplication()
  let actionDelegate = ActionDelegate.shared

  override func setUpWithError() throws {
    try super.setUpWithError()

    app.launch()
  }

  // MARK: Tap

  func testTap() throws {
    let tapCell = app.staticTexts["Tap"]
    XCTAssert(tapCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: tapCell, testCase: self)

    let tapButton = app.buttons["tapButton"]
    XCTAssert(tapButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.tap(times: 1), on: tapButton, testCase: self)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testTapOnAxis() throws {
    let tapCell = app.staticTexts["Tap on Axis"]
    XCTAssert(tapCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: tapCell, testCase: self)

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(
      action: Action.tapOnAxis(
        x: Int(screenView.frame.width / 2),
        y: Int(screenView.frame.height / 2)
      ),
      on: screenView,
      testCase: self
    )
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  // MARK: Long-press

  func testLongPress() throws {
    let longPressCell = app.staticTexts["Long Press"]
    XCTAssert(longPressCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressCell, testCase: self)

    let longPressButton = app.buttons["longPressButton"]
    XCTAssert(longPressButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.longPress, on: longPressButton, testCase: self)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testShortPress() throws {
    let longPressCell = app.staticTexts["Long Press"]
    XCTAssert(longPressCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressCell, testCase: self)

    let longPressButton = app.buttons["longPressButton"]
    XCTAssert(longPressButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressButton, testCase: self)
    XCTAssertNotEqual(resultLabel.label, "Success!")
  }

  // MARK: Long-press and drag

  func testLongPressAndDragElements() throws {
    let longPressAndDragCell = app.staticTexts["Long Press & Drag"]
    XCTAssert(longPressAndDragCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressAndDragCell, testCase: self)

    let longPressAndDragButton = app.buttons["longPressAndDragButton"]
    XCTAssert(longPressAndDragButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    let action = Action.longPressAndDrag(
      duration: 0.7,
      normalizedPositionX: nil,
      normalizedPositionY: nil,
      targetElement: resultLabel,
      normalizedTargetPositionX: nil,
      normalizedTargetPositionY: nil,
      speed: .slow,
      holdDuration: nil
    )
    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testLongPressAndDragCoordinates() throws {
    let longPressAndDragCell = app.staticTexts["Long Press & Drag"]
    XCTAssert(longPressAndDragCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressAndDragCell, testCase: self)

    let longPressAndDragButton = app.buttons["longPressAndDragButton"]
    XCTAssert(longPressAndDragButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    let action = Action.longPressAndDrag(
      duration: 0.7,
      normalizedPositionX: 0.2,
      normalizedPositionY: 0.2,
      targetElement: resultLabel,
      normalizedTargetPositionX: 0.7,
      normalizedTargetPositionY: 0.6,
      speed: .fast,
      holdDuration: nil
    )
    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testShortPressAndDrag() throws {
    let longPressAndDragCell = app.staticTexts["Long Press & Drag"]
    XCTAssert(longPressAndDragCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressAndDragCell, testCase: self)

    let longPressAndDragButton = app.buttons["longPressAndDragButton"]
    XCTAssert(longPressAndDragButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    let action = Action.longPressAndDrag(
      duration: 0.3,
      normalizedPositionX: nil,
      normalizedPositionY: nil,
      targetElement: resultLabel,
      normalizedTargetPositionX: nil,
      normalizedTargetPositionY: nil,
      speed: .slow,
      holdDuration: nil
    )
    try actionDelegate.act(action: action, on: longPressAndDragButton, testCase: self)

    XCTAssertNotEqual(resultLabel.label, "Success!")
  }

  func testLongPressWithoutDrag() throws {
    let longPressAndDragCell = app.staticTexts["Long Press & Drag"]
    XCTAssert(longPressAndDragCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressAndDragCell, testCase: self)

    let longPressAndDragButton = app.buttons["longPressAndDragButton"]
    XCTAssert(longPressAndDragButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.longPress, on: longPressAndDragButton, testCase: self)
    XCTAssertNotEqual(resultLabel.label, "Success!")
  }
}

// MARK: Swipe
