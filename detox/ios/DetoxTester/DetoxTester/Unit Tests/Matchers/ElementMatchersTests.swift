//
//  ElementMatchersTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ElementMatchersTests: DTXTestCase {
  var app: XCUIApplication!
  var matcher: ElementMatcher!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    matcher = ElementMatcher(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let cell = app.staticTexts["Elements Matching"]
    XCTAssert(cell.waitForExistence(timeout: 30))

    cell.tap()

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))
  }

  func testMatchByDefaultLabel() throws {
    let result = try matcher.match(to: .label("Label value", isRegex: false))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByCustomLabel() throws {
    let result = try matcher.match(to: .label("Text field label", isRegex: false))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "textFieldIdentifier")
  }

  func testMatchByLabelWithRegex() throws {
    let result = try matcher.match(to: .label("/^[a-z]* field label$/i", isRegex: true))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "textFieldIdentifier")
  }

  func testMatchByWrongLabel() throws {
    let result = try matcher.match(to: .label("Label valueZ", isRegex: false))

    XCTAssertEqual(result.count, 0)
  }

  func testMatchByValue() throws {
    let result = try matcher.match(to: .value("Text Field Value"))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "textFieldIdentifier")
  }

  func testMatchByWrongValue() throws {
    let result = try matcher.match(to: .value("Text Field ValueZ"))

    XCTAssertEqual(result.count, 0)
  }

  func testMatchById() throws {
    let result = try matcher.match(to: .id("labelIdentifier", isRegex: false))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByIdWithRegex() throws {
    let result = try matcher.match(to: .id("/^[a-z]*fier$/i", isRegex: true))

    XCTAssertEqual(result.count, 2)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByWrongId() throws {
    let result = try matcher.match(to: .id("labelIdentifierZ", isRegex: false))

    XCTAssertEqual(result.count, 0)
  }

  func testMatchByIdAndLabel() throws {
    let result = try matcher.match(to: .and(patterns: [
      .label("Label value", isRegex: false),
      .id("labelIdentifier", isRegex: false)
    ]))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByWrongIdAndLabel() throws {
    let result = try matcher.match(to: .and(patterns: [
      .label("Label value", isRegex: false),
      .id("labelIdentifierz", isRegex: false)
    ]))

    XCTAssertEqual(result.count, 0)
  }
}
