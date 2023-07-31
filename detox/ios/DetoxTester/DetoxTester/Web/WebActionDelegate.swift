//
//  WebActionDelegate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for actions that can be performed on an web element.
class WebActionDelegate: WebActionDelegateProtocol {
  /// The application to perform actions on.
  let app: XCUIApplication

  /// Creates a new web action delegate.
  init(_ app: XCUIApplication) {
    self.app = app
  }

  func act(
    action: DetoxInvokeHandler.WebAction,
    on element: AnyHashable,
    host webView: AnyHashable
  ) throws {
    return try act(
      action: action,
      on: element,
      host: webView,
      testCase: DetoxTester.shared.testCase!
    )
  }

  func act(
    action: DetoxInvokeHandler.WebAction,
    on element: AnyHashable,
    host webView: AnyHashable,
    testCase: XCTestCase
  ) throws {
    guard let element = element as? XCUIElement, let webView = webView as? XCUIElement else {
      fatalError("element is not XCUIElement")
    }

    switch action {
      case .tap:
        element.tap()

      case .typeText(let text, _):
        try element.changeText(.type(text), app: app)

      case .replaceText(let text):
        try element.changeText(.replace(text), app: app)

      case .clearText:
        try element.changeText(.clear, app: app)

      case .selectAllText:
        try element.selectAllText(app: app, completion: nil)

      case .scrollToView:
        try webView.scrollToView(to: element, testCase: testCase)

      case .focus:
        try element.focusKeyboard()

      case .moveCursorToEnd:
        try element.focusKeyboard()

      case .runScript, .runScriptWithArgs:
        fatalError("not supported")

      case .getText, .getCurrentUrl, .getTitle:
        fatalError("should not get here, this is a getter action!")
    }
  }

  func getText(of element: AnyHashable) throws -> AnyCodable {
    guard let element = element as? XCUIElement else {
      fatalError("element is not XCUIElement")
    }

    return AnyCodable(String(describing: element.value ?? ""))
  }

  func getCurrentUrl(of element: AnyHashable) throws -> AnyCodable {
    fatalError("not supported")
  }

  func getTitle(of element: AnyHashable) throws -> AnyCodable {
    guard let element = element as? XCUIElement else {
      fatalError("element is not XCUIElement")
    }

    return AnyCodable(element.title)
  }
}
