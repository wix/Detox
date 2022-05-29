//
//  KeyboardTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class KeyboardTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var textField: XCUIElement!
  var resultLabel: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let keyboardCell = app.staticTexts["Keyboard Actions"]
    XCTAssert(keyboardCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: keyboardCell, testCase: self)

    textField = app.textFields["textField"]
    XCTAssert(textField.waitForExistence(timeout: 30))

    resultLabel = app.staticTexts["resultLabel"]
    XCTAssertEqual(resultLabel.label, "Text Will Be Here")
  }

  func testHasPlacehoder() throws {
    XCTAssertEqual(textField.value as! String, "placeholder text")
  }

  func testChangeText() throws {
    try actionDelegate.act(action: Action.changeText(.type("hello")), on: textField, testCase: self)

    XCTAssertEqual(textField.value as! String, "hello")

    try actionDelegate.act(
      action: Action.changeText(.type(" world")),
      on: textField,
      testCase: self
    )

    XCTAssertEqual(textField.value as! String, "hello world")

    try actionDelegate.act(
      action: Action.changeText(.replace("h3l!0_w071d")),
      on: textField,
      testCase: self
    )

    XCTAssertEqual(textField.value as! String, "h3l!0_w071d")

    try actionDelegate.act(action: Action.changeText(.clear), on: textField, testCase: self)

    XCTAssertEqual(textField.value as! String, "placeholder text")
  }

  func testTapBackspace() throws {
    try actionDelegate.act(
      action: Action.changeText(.type("hello worldd")),
      on: textField,
      testCase: self
    )

    XCTAssertEqual(textField.value as! String, "hello worldd")

    try actionDelegate.act(action: Action.tapKey(.backspaceKey), on: textField, testCase: self)

    XCTAssertEqual(textField.value as! String, "hello world")
  }

  func testTapReturn() throws {
    try actionDelegate.act(
      action: Action.changeText(.type("hello world")),
      on: textField,
      testCase: self
    )

    XCTAssertEqual(textField.value as! String, "hello world")

    try actionDelegate.act(action: Action.tapKey(.returnKey), on: textField, testCase: self)

    XCTAssertEqual(resultLabel.label, "hello world")
  }
}
