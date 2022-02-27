//
//  ElementMatcher.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxMessageHandler
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
    switch pattern {
      case .text(let text):
        let predicate = NSPredicate(format: "label CONTAINS[c] '%s'", text)

        // There's also the option for `allElementsBoundByAccessibilityElement`.
        // This resolves the element when calling it and not when creating this array..
        return app.staticTexts.containing(predicate).textViews.allElementsBoundByIndex
        
      case .label(let label):


      case .and(let patterns):
        <#code#>

      case .id(let id):
        // not enough
        return [app.buttons[id]]

      case .ancestor(let pattern):
        app.

      case .decendant(let pattern):
        <#code#>
    }
  }
}
