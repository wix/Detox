//
//  XCUIElementQuery+webMatching.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import DetoxInvokeHandler
import XCTest

/// Extension to `XCUIElementQuery` that adds matching capabilities that uses the white-box handler of Detox
/// (which are not available in XCUITest).
extension XCUIElementQuery {
  /// Returns a new query matches the given pattern.
  func webMatching(
    pattern: WebElementPattern, webView: XCUIElement
  ) throws -> XCUIElementQuery {
    switch pattern {
      case .id(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .className(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .cssSelector(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .name(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .xpath(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .href(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .hrefContains(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .tag(_):
        throw Error.operationNotSupported(pattern: pattern)

      case .label(let label):
        return webViews.descendants(matching: .any).matching(NSPredicate { evaluatedObject, _ in
          guard let element = evaluatedObject as? NSObject else {
            return false
          }
          return element.value(forKey: "label") as? String == label
        })

      case .value(let value):
        return webViews.descendants(matching: .any).matching(NSPredicate { evaluatedObject, _ in
          guard let element = evaluatedObject as? NSObject else {
            return false
          }
          return element.value(forKey: "value") as? String == value
        })
    }
  }
}

