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
}
