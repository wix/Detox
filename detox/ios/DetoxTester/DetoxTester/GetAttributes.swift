//
//  GetAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class GetAttributes: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()

    let attributesCell = app.staticTexts["Get Attributes"]
    XCTAssert(attributesCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: attributesCell, testCase: self)

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))
  }

  func testLabelAttributeד() throws {
    let labelElement = app.staticTexts["labelIdentifier"]

    let attributes = try actionDelegate.getAttributes(from: [labelElement])
    XCTAssertEqual(
      attributes,
      AnyCodable(
        [
          "identifier": AnyCodable("foo")
        ]
      )
    )
  }

  func testMultipleElements() throws {
  }
}
