//
//  WheelPickerTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class WheelPickerTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var wheelPicker: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()

    let pickerCell = app.staticTexts["Column Picker"]
    XCTAssert(pickerCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: pickerCell, testCase: self)

    wheelPicker = app.pickers["wheelPicker"]
    XCTAssert(wheelPicker.waitForExistence(timeout: 30))
  }

  func testPickFirstColumn() throws {
    let action = Action.setColumnToValue(index: 0, value: "Item 3")

    try actionDelegate.act(action: action, on: wheelPicker, testCase: self)

    XCTAssertEqual(wheelPicker.pickerWheels.element(boundBy: 0).value as! String, "Item 3")
  }

  func testPickSecondColumn() throws {
    let action = Action.setColumnToValue(index: 1, value: "Item B")

    try actionDelegate.act(action: action, on: wheelPicker, testCase: self)

    XCTAssertEqual(wheelPicker.pickerWheels.element(boundBy: 1).value as! String, "Item B")
  }
}
