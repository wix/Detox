//
//  WebExpectationDelegate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for expectations that can be performed on a web element.
class WebExpectationDelegate: WebExpectationDelegateProtocol {
  func expect(
    _ expectation: DetoxInvokeHandler.WebExpectation,
    isTruthy: Bool,
    on element: AnyHashable?
  ) throws {
    let element = element as? XCUIElement
    let elementDescription = element != nil ? element!.cleanIdentifier : "none"

    expectLog(
      "expect element `\(elementDescription)` to \(isTruthy ? "" : "not ")\(expectation)"
    )

    switch expectation {
      case .toHaveText(let text):
        guard let element = element else {
          fatalError("element does not exist")
        }

        try element.assertLabel(equals: text, isTruthy: isTruthy)

      case .toExist:
        if element == nil && !isTruthy {
          // If the element is nil and we expect it to not exist, then we're good.
          return
        }

        guard let element = element else {
          fatalError("element is not XCUIElement")
        }

        try element.assertExists(isTruthy: isTruthy)
    }
  }
}
