//
//  PredicateHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class PredicateHandler {
  let springboardApp: XCUIApplication
  let appUnderTest: XCUIApplication

  init(springboardApp: XCUIApplication, appUnderTest: XCUIApplication) {
    self.springboardApp = springboardApp
    self.appUnderTest = appUnderTest
  }

  func findElement(using params: InvocationParams) -> XCUIElement {
      guard let predicate = params.predicate else {
          fatalError("expected predicate param")
      }
    let query: XCUIElementQuery

    switch params.type {
      case .systemAction, .systemExpectation:
        query = createSystemQuery(type: predicate.type, value: predicate.value)

      case .webAction, .webExpectation:
        query = createWebViewQuery(type: predicate.type, value: predicate.value)
    }

    let atIndex = params.atIndex ?? 0
    return query.element(boundBy: atIndex)
  }

  func createSystemQuery(
    type: InvocationParams.Predicate.PredicateType,
    value: String
  ) -> XCUIElementQuery {
    switch type {
      case .label:
        return springboardApp.descendants(matching: .any).matching(identifier: value)

      case .type:
        let elementType = try! XCUIElement.ElementType.from(string: value)
        return springboardApp.descendants(matching: elementType)
    }
  }

  func createWebViewQuery(
    type: InvocationParams.Predicate.PredicateType,
    value: String
  ) -> XCUIElementQuery {
    switch type {
      case .label:
        return appUnderTest.webViews.descendants(matching: .any).matching(identifier: value)

      case .type:
        let elementType = try! XCUIElement.ElementType.from(string: value)
        return appUnderTest.webViews.descendants(matching: elementType)
    }
  }
}
