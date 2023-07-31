//
//  WheelPickerTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class WebViewTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!
  var webActionDelegate: WebActionDelegate!
  var webView: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(
      app,
      whiteBoxMessageHandler: { _ in return nil }
    )

    webActionDelegate = WebActionDelegate(app)

    app.launch()

    let safariWebView = app.staticTexts["Safari Web View"]
    XCTAssert(safariWebView.waitForExistence(timeout: 30))


    let container = app.children(matching: .any).run().first!

    try actionDelegate.act(
      action: .scroll(.to(.bottom)),
      on: container,
      testCase: self
    )

    try actionDelegate.act(action: Action.tap(times: 1), on: safariWebView, testCase: self)

    webView = app.webViews.firstMatch
    XCTAssert(webView.waitForExistence(timeout: 30))
  }

  func testTypeTextAndTap() throws {
    let typeAction = WebAction.typeText(text: "my text here", isContentEditable: false)
    let textInput = webView.textFields.firstMatch
    try webActionDelegate.act(action: typeAction, on: textInput, host: webView, testCase: self)

    let pressMeButton = webView.buttons["Press me!"]

    try webActionDelegate.act(
      action: .scrollToView, on: pressMeButton, host: webView, testCase: self)

    try webActionDelegate.act(
      action: .tap, on: pressMeButton, host: webView, testCase: self)

    let textElement = webView.staticTexts["my text here"]

    XCTAssertTrue(textElement.exists)
  }
}
