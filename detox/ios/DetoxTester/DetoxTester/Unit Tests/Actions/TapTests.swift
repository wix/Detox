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
  var tapButton: XCUIElement!
  var screenView: XCUIElement!
  var resultLabel: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()

    let tapCell = app.staticTexts["Tap"]
    XCTAssert(tapCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: tapCell, testCase: self)

    tapButton = app.buttons["tapButton"]
    screenView = app.otherElements["screenView"]
    XCTAssert(tapButton.waitForExistence(timeout: 30))

    resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")
  }

  func testTap() throws {
    try actionDelegate.act(action: Action.tap(times: 1), on: tapButton, testCase: self)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testTapOnAxis() throws {
    let action = Action.tapOnAxis(
      x: Int(screenView.frame.width / 2),
      y: Int(screenView.frame.height / 2)
    )

    try actionDelegate.act(action: action, on: screenView, testCase: self)

    XCTAssertEqual(resultLabel.label, "Success!")
  }
}
