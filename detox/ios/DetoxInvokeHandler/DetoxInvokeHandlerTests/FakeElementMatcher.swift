//
//  FakeElementMatcher.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

class FakeElementMatcher: ElementMatcherProtocol {
  struct Error: Swift.Error { }

  private var patternToElements: [ElementPattern: [AnyHashable]] = [:]
  private var defaultWebView: AnyHashable = "webView"
  private var webPatternToJSFunc: [WebElementPattern: String] = [:]

  func setMatch(from: ElementPattern, to: AnyHashable) {
    patternToElements[from] = (patternToElements[from] ?? []) + [to]
  }

  func setWebMatch(from: WebElementPattern, to jsFunction: String) {
    webPatternToJSFunc[from] = jsFunction
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    guard let elements = patternToElements[pattern] else {
      throw Error()
    }

    return elements
  }

  func matchWebViews(to pattern: ElementPattern?) throws -> [AnyHashable] {
    if pattern == nil {
      return [defaultWebView]
    }

    guard let elements = patternToElements[pattern!] else {
      throw Error()
    }

    return elements
  }

  func createJSWebViewElementMatcher(
    on webView: AnyHashable, to pattern: WebElementPattern
  ) throws -> JSWebViewHandler {
    guard let handler = webPatternToJSFunc[pattern] else {
      throw Error()
    }

    return handler
  }
}
