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

  init(app: XCUIApplication) {
    self.app = app
  }

  func match(to pattern: ElementPattern) throws -> [AnyHashable] {
    matcherLog("called to match pattern: \(pattern)")
    
    
    switch pattern {
      case .text(let text):
        // TODO: need to distinguish between text and id.
        matcherLog("matcher found button: \(app.buttons[text])", type: .debug)
        return [app.buttons[text]]

      case .label(let label):
        let predicate = NSPredicate(format: "label CONTAINS[c] '%s'", label)

        // There's also the option for `allElementsBoundByAccessibilityElement`.
        // This resolves the element when calling it and not when creating this array..
        return app.staticTexts.containing(predicate).textViews.allElementsBoundByIndex

      case .and(let patterns):
        fatalError("not implmented yet")

      case .id(let id):
        // not enough
        return [app.buttons[id]]

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
