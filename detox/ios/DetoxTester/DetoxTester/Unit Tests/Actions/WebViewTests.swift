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
  var matcher: ElementMatcher!
  var webView: XCUIElement!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(
      app,
      whiteBoxMessageHandler: { _ in return nil }
    )

    webActionDelegate = WebActionDelegate(app)

    matcher = ElementMatcher(app, whiteBoxMessageHandler: { _ in return nil })

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

  func testFindElementWithLabel() throws {
    let helloWorldTitle = try matcher
      .matchWebViewElements(on: webView, to: .label("hello-world")).first
    guard let helloWorldTitle = helloWorldTitle as? XCUIElement else {
      XCTFail("Expected to find hello-world label")
      return
    }

    XCTAssert(helloWorldTitle.waitForExistence(timeout: 30))
  }

  func testTypeTextAndTap() throws {
    let typeAction = WebAction.typeText(text: "my text here", isContentEditable: false)
    let textInput = webView.textFields.firstMatch
    try webActionDelegate.act(action: typeAction, on: textInput, host: webView, testCase: self)

    let pressMeButton = webView.buttons["Press me!"]
    try webActionDelegate.act(
      action: .tap, on: pressMeButton, host: webView, testCase: self)

    let textElement = webView.staticTexts["my text here"]
    XCTAssert(textElement.waitForExistence(timeout: 30))
  }
}
