//
//  PredicateHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class PredicateHandler {
  let springboardApp: XCUIApplication

  init(springboardApp: XCUIApplication) {
    self.springboardApp = springboardApp
  }

  func findElement(using params: InvocationParams) -> XCUIElement {
    let predicate = params.predicate
    let query: XCUIElementQuery

    switch predicate.type {
      case .label:
        query = springboardApp.descendants(matching: .any).matching(identifier: predicate.value)

      case .type:
        let elementType = try! XCUIElement.ElementType.from(string: predicate.value)
        query = springboardApp.descendants(matching: elementType)
    }

    let atIndex = params.atIndex ?? 0
    return query.element(boundBy: atIndex)
  }
}
