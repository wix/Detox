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

  // MARK: Tap tests

  func testTap() throws {
    let tapCell = app.staticTexts["tap"]
    XCTAssert(tapCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: tapCell)

    let tapButton = app.buttons["tapButton"]
    XCTAssert(tapButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.tap(times: 1), on: tapButton)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testTapOnAxis() throws {
    let tapCell = app.staticTexts["tap"]
    XCTAssert(tapCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: tapCell)

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(
      action: Action.tapOnAxis(
        x: Int(screenView.frame.width / 2),
        y: Int(screenView.frame.height / 2)
      ),
      on: screenView
    )
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  // MARK: Long-press tests

  func testLongPress() throws {
    let longPressCell = app.staticTexts["longPress"]
    XCTAssert(longPressCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressCell)

    let longPressButton = app.buttons["longPressButton"]
    XCTAssert(longPressButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.longPress, on: longPressButton)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testLongPressFails() throws {
    let longPressCell = app.staticTexts["longPress"]
    XCTAssert(longPressCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressCell)

    let longPressButton = app.buttons["longPressButton"]
    XCTAssert(longPressButton.waitForExistence(timeout: 30))

    let resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressButton)
    XCTAssertNotEqual(resultLabel.label, "Success!")
  }
}
