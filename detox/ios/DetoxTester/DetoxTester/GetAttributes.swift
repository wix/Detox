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

  func decode(from codable: AnyCodable) throws -> ElementAttributes {
    let data = try JSONSerialization.data(withJSONObject: codable)
    self = try JSONDecoder().decode(ElementAttributes.self, from: data)

  }

  func testIdentifierAttribute() throws {
    let labelElement = app.staticTexts["labelIdentifier"]

    let result = try actionDelegate.getAttributes(from: [labelElement])
    let elementsAttributes = result.asList()!
    XCTAssertEqual(elementsAttributes.count, 1)

    let labelElementAttributes = elementsAttributes.first!.asStringKeyedDictionary()!
    XCTAssertEqual(labelElementAttributes["identifier"], AnyCodable("labelIdentifier"))
  }

  //      AnyCodable(
  //        [
  //          "focused": AnyCodable(false),
  //          "normalizedActivationPoint": AnyCodable([
  //            "x": "1.496884735202492",
  //            "y": "8.283102143757882"
  //          ]),
  //          "hittable": AnyCodable(1),
  //          "activationPoint": AnyCodable([
  //            "x": "195.2031250000001",
  //            "y": "205.265625"
  //          ]),
  //          "identifier": AnyCodable("labelIdentifier"),
  //          "frame": AnyCodable(arrayLiteral: [
  //            "origin": [
  //              "x": 130,
  //              "y": "192.875"
  //            ],
  //            "size": [
  //              "height": "24.78125",
  //              "width": "130.40625"
  //            ]
  //          ]),
  //          "isAccessibilityElement": AnyCodable(0),
  //          "enabled": AnyCodable(true),
  //          "selected": AnyCodable(true),
  //          "visible": AnyCodable(true)
  //        ]
  //      )
  //    )
}
