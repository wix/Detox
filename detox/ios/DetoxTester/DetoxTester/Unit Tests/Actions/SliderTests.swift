//
//  SliderTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class SliderTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var screenView: XCUIElement!
  var sliderView: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()

    let sliderCell = app.staticTexts["Adjust Slider"]
    XCTAssert(sliderCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: sliderCell, testCase: self)

    screenView = app.otherElements["screenView"]
    sliderView = app.sliders["sliderView"]
    XCTAssert(sliderView.waitForExistence(timeout: 30))
  }

  func testAdjustSlider() throws {
    try actionDelegate.act(
      action: Action.adjustSlider(normalizedPosition: 0.7),
      on: sliderView,
      testCase: self
    )

    XCTAssert(abs(sliderView.normalizedSliderPosition - 0.7) < 0.05)
  }

  func testAdjustSliderToZero() throws {
    try actionDelegate.act(
      action: Action.adjustSlider(normalizedPosition: 0),
      on: sliderView,
      testCase: self
    )

    XCTAssertEqual(sliderView.normalizedSliderPosition, 0)
  }

  func testAdjustSliderFromParent() throws {
    try actionDelegate.act(
      action: Action.adjustSlider(normalizedPosition: 0.7),
      on: screenView,
      testCase: self
    )

    XCTAssert(abs(sliderView.normalizedSliderPosition - 0.7) < 0.05)
  }
}
