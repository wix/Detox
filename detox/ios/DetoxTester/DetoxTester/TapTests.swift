//
//  TapTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class TapTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()
  }

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

}
