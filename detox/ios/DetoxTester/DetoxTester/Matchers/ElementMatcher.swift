//
//  ElementMatcher.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for matching elements.
class ElementMatcher: ElementMatcherProtocol {
  let app: XCUIApplication

  let whiteBoxMessageHandler: WhiteBoxMessageHandler

  init(_ app: XCUIApplication, whiteBoxMessageHandler: @escaping WhiteBoxMessageHandler) {
    self.app = app
    self.whiteBoxMessageHandler = whiteBoxMessageHandler
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    matcherLog("called to match with pattern: \(pattern)")

    let result: [XCUIElement] = try app.newQuery().matching(
      pattern: pattern,
      whiteBoxMessageHandler: whiteBoxMessageHandler,
      app: app
    ).run()

    if result.isEmpty {
      matcherLog("found zero elements", type: .error)
    } else {
      matcherLog(
        "matched elements: " +
        "\(result.map {"(\($0.identifier), size: \($0.frame.size), origin: \($0.frame.origin))"})"
      )
    }

    return result
  }

  func matchWebViews(to pattern: ElementPattern?) throws -> [AnyHashable] {
    matcherLog("called to match web-views with pattern: " +
               "\(pattern != nil ? String(describing: pattern) : "default web-view")")

    let query: XCUIElementQuery = app.newQuery().webViews
    let result: [XCUIElement]

    if let pattern = pattern {
      result = try query.matching(
        pattern: pattern,
        whiteBoxMessageHandler: whiteBoxMessageHandler,
        app: app
      ).run()
    } else {
      result = [query.firstMatch]
    }

    if result.isEmpty {
      matcherLog("found zero elements", type: .error)
    } else {
      matcherLog(
        "matched elements: " +
        "\(result.map {"(\($0.identifier), size: \($0.frame.size), origin: \($0.frame.origin))"})"
      )
    }

    return result
  }

  func createJSWebViewElementMatcher(
    on webView: AnyHashable,
    to pattern: WebElementPattern
  ) throws -> JSWebViewHandler {
    matcherLog("called to match web-view elements with pattern: \(String(describing: pattern))")

    guard let webView = webView as? XCUIElement else {
      fatalError("`webView` must be an XCUIElement")
    }

    return JSWebViewHandler(js: createJSFunction(from: pattern), onWebView: webView)
  }

  private func createJSFunction(from pattern: WebElementPattern) -> String {
    return ""
  }
}
