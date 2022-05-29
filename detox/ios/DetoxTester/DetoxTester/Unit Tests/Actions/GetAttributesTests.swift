//
//  GetAttributesTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class GetAttributesTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let attributesCell = app.staticTexts["Get Attributes"]
    XCTAssert(attributesCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: attributesCell, testCase: self)

    let screenView = app.otherElements["screenView"]
    XCTAssert(screenView.waitForExistence(timeout: 30))
  }

  func testLabelElementAttributes() throws {
    let labelAttributes = try getLabelElementAttributes()
    XCTAssertEqual(labelAttributes["identifier"], AnyCodable("labelIdentifier"))
    XCTAssertEqual(labelAttributes["label"], AnyCodable("accessibility label"))
    XCTAssertEqual(labelAttributes["focused"], AnyCodable(false))
    XCTAssertEqual(labelAttributes["hittable"], AnyCodable(true))
    XCTAssertEqual(labelAttributes["selected"], AnyCodable(false))
    XCTAssertEqual(labelAttributes["visible"], AnyCodable(true))
    XCTAssertEqual(labelAttributes["enabled"], AnyCodable(true))
    XCTAssertEqual(labelAttributes["type"], AnyCodable("staticText"))
    XCTAssertEqual(labelAttributes["text"], AnyCodable("accessibility label"))

    let normalizedActivationPoint = (
      labelAttributes["normalizedActivationPoint"] as! AnyCodable
    ).value as! [String: AnyHashable]
    XCTAssert(normalizedActivationPoint["x"] is CGFloat)
    XCTAssert(normalizedActivationPoint["y"] is CGFloat)

    let activationPoint = (
      labelAttributes["activationPoint"] as! AnyCodable
    ).value as! [String: AnyHashable]
    XCTAssert(activationPoint["x"] is CGFloat)
    XCTAssert(activationPoint["y"] is CGFloat)

    let frame = (
      labelAttributes["frame"] as! AnyCodable
    ).value as! [String: AnyHashable]
    let frameOrigin = frame["origin"] as! [String: AnyHashable]
    let frameSize = frame["size"] as! [String: AnyHashable]
    XCTAssert(frameOrigin["x"] is CGFloat)
    XCTAssert(frameOrigin["y"] is CGFloat)
    XCTAssert(frameSize["width"] is CGFloat)
    XCTAssert(frameSize["height"] is CGFloat)
  }

  func testSliderElementAttributes() throws {
    let sliderAttributes = try getSliderElementAttributes()
    XCTAssertEqual(sliderAttributes["identifier"], AnyCodable("sliderView"))
    XCTAssertEqual(sliderAttributes["label"], AnyCodable("slider label"))
    XCTAssertEqual(sliderAttributes["focused"], AnyCodable(false))
    XCTAssertEqual(sliderAttributes["hittable"], AnyCodable(true))
    XCTAssertEqual(sliderAttributes["selected"], AnyCodable(true))
    XCTAssertEqual(sliderAttributes["visible"], AnyCodable(true))
    XCTAssertEqual(sliderAttributes["enabled"], AnyCodable(false))
    XCTAssertEqual(sliderAttributes["value"]!, AnyCodable("‏75%"))
    XCTAssertEqual(sliderAttributes["normalizedSliderPosition"], AnyCodable(0.75))
    XCTAssertEqual(sliderAttributes["type"], AnyCodable("slider"))
    XCTAssertEqual(sliderAttributes["text"], AnyCodable("slider label"))

    let normalizedActivationPoint = (
      sliderAttributes["normalizedActivationPoint"] as! AnyCodable
    ).value as! [String: AnyHashable]
    XCTAssert(normalizedActivationPoint["x"] is CGFloat)
    XCTAssert(normalizedActivationPoint["y"] is CGFloat)

    let activationPoint = (
      sliderAttributes["activationPoint"] as! AnyCodable
    ).value as! [String: AnyHashable]
    XCTAssert(activationPoint["x"] is CGFloat)
    XCTAssert(activationPoint["y"] is CGFloat)

    let frame = (
      sliderAttributes["frame"] as! AnyCodable
    ).value as! [String: AnyHashable]
    let frameOrigin = frame["origin"] as! [String: AnyHashable]
    let frameSize = frame["size"] as! [String: AnyHashable]
    XCTAssert(frameOrigin["x"] is CGFloat)
    XCTAssert(frameOrigin["y"] is CGFloat)
    XCTAssert(frameSize["width"] is CGFloat)
    XCTAssert(frameSize["height"] is CGFloat)
  }
}

extension GetAttributesTests {
  private func getLabelElementAttributes() throws -> [String: AnyHashable] {
    let element = app.staticTexts["labelIdentifier"]

    let result = try actionDelegate.getAttributes(from: [element]).value as! [AnyCodable]
    XCTAssertEqual(result.count, 1)

    return result.first?.value as! [String: AnyHashable]
  }

  private func getSliderElementAttributes() throws -> [String: AnyHashable] {
    let element = app.sliders["sliderView"]

    let result = try actionDelegate.getAttributes(from: [element]).value as! [AnyCodable]
    XCTAssertEqual(result.count, 1)

    return result.first?.value as! [String: AnyHashable]
  }
}
