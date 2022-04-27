//
//  ElementMatcher.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ElementMatcher: ElementMatcherProtocol {
  let app: XCUIApplication
  // when calling matching(identifier:)
  //
  // - identifier:
  // A string to match against any one of each element’s identifying properties:
  //   identifier, title, label, value, or placeholderValue.

  init(_ app: XCUIApplication) {
    self.app = app
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    matcherLog("called to match pattern: \(pattern)")
    
    
    switch pattern {
      case .text(let text):
        let element = [app.otherElements[text], app.staticTexts[text]].first { element in
          element.exists
        }

        guard let element = element else {
          matcherLog("matcher did not found element with text: \(text)", type: .error)
          matcherLog("application info: \(app.debugDescription)", type: .debug)
          fatalError("Error matching element")
        }

        matcherLog("element: `\(element)` were found")
        return [element]

      case .label(let label):
        fatalError("not implmented yet")

      case .and(let patterns):
        fatalError("not implmented yet")

      case .id(let id):
        fatalError("not implmented yet")

      case .ancestor(let pattern):
        fatalError("not implmented yet")

      case .decendant(let pattern):
        fatalError("not implmented yet")

      case .value(_):
        fatalError("not implmented yet")

      case .traits(_):
        fatalError("not implmented yet")
    }
  }
}
