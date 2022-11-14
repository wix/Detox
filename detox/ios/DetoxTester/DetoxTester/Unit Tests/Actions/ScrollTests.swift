//
//  ScrollTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ScrollTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var scrollView: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app, whiteBoxMessageHandler: { _ in return nil })

    app.launch()

    let scrollCell = app.staticTexts["Scroll"]
    XCTAssert(scrollCell.waitForExistence(timeout: 30))

    try actionDelegate.act(action: Action.tap(times: 1), on: scrollCell, testCase: self)

    scrollView = app.scrollViews["scrollView"]
    XCTAssert(scrollView.waitForExistence(timeout: 30))

    XCTAssertTrue(app.staticTexts["Top"].isVisible)
    XCTAssertFalse(app.staticTexts["Bottom"].isVisible)
  }

  func testScrollToBottomEdge() throws {
    try actionDelegate.act(action: Action.scroll(.to(.bottom)), on: scrollView, testCase: self)

    XCTAssertFalse(app.staticTexts["Top"].isVisible)
    XCTAssertTrue(app.staticTexts["Bottom"].isVisible)
  }

  func testScrollToTopEdge() throws {
    try actionDelegate.act(action: Action.scroll(.to(.bottom)), on: scrollView, testCase: self)
    try actionDelegate.act(action: Action.scroll(.to(.top)), on: scrollView, testCase: self)

    XCTAssertTrue(app.staticTexts["Top"].isVisible)
    XCTAssertFalse(app.staticTexts["Bottom"].isVisible)
  }

  func testShortScrollWithParams() throws {
    let action = Action.scroll(
      .withParams(
        offset: 100,
        direction: .bottom,
        startNormalizedPositionX: nil,
        startNormalizedPositionY: nil
      )
    )

    try actionDelegate.act(action: action, on: scrollView, testCase: self)

    XCTAssertFalse(app.staticTexts["Top"].isVisible)
    XCTAssertFalse(app.staticTexts["Bottom"].isVisible)
  }

  func testLongScrollWithParams() throws {
    let action = Action.scroll(
      .withParams(
        offset: 500,
        direction: .bottom,
        startNormalizedPositionX: nil,
        startNormalizedPositionY: nil
      )
    )
    
    try actionDelegate.act(action: action, on: scrollView, testCase: self)

    XCTAssertFalse(app.staticTexts["Top"].isVisible)
    XCTAssertTrue(app.staticTexts["Bottom"].isVisible)
  }
}
