//
//  ElementMatchersTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

class ElementMatchersTests: DTXTestCase {
  var app: XCUIApplication!
  var matcher: ElementMatcher!
  var pinchView: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    matcher = ElementMatcher(app)

    app.launch()

    let cell = app.staticTexts["Elements Matching"]
    XCTAssert(cell.waitForExistence(timeout: 30))

    cell.tap()

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))
  }

  func testMatchByLabel() throws {
    let result = try matcher.match(to: .label("Label value"))
    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByValue() throws {
    let result = try matcher.match(to: .value("Text Field Value"))
    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "textFieldIdentifier")
  }

  func testMatchById() throws {
    let result = try matcher.match(to: .id("labelIdentifier"))
    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByIdAndLabel() throws {
    let result = try matcher.match(to: .and(patterns: [
      .label("Label value"),
      .id("labelIdentifier")
    ]))

    XCTAssertEqual(result.count, 1)
    XCTAssertEqual((result.first as! XCUIElement).identifier, "labelIdentifier")
  }

  func testMatchByWrongIdAndLabel() throws {
    let result = try matcher.match(to: .and(patterns: [
      .label("Label value"),
      .id("labelIdentifierz")
    ]))

    XCTAssertEqual(result.count, 0)
  }
}
