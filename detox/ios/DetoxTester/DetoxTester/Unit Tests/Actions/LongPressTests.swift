//
//  LongPressTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class LongPressTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var longPressButton: XCUIElement!
  var resultLabel: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let longPressCell = app.staticTexts["Long Press"]
    XCTAssert(longPressCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: longPressCell, testCase: self)

    longPressButton = app.buttons["longPressButton"]
    XCTAssert(longPressButton.waitForExistence(timeout: 30))

    resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")
  }

  func testLongPress() throws {
    try actionDelegate.act(action: Action.longPress, on: longPressButton, testCase: self)
    XCTAssertEqual(resultLabel.label, "Success!")
  }

  func testShortPress() throws {
    try actionDelegate.act(action: Action.tap(times: 1), on: longPressButton, testCase: self)
    XCTAssertNotEqual(resultLabel.label, "Success!")
  }
}
