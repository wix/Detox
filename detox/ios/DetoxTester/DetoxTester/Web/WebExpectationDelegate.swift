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
    on element: AnyHashable
  ) throws {
    guard let element = element as? XCUIElement else {
      fatalError("element is not XCUIElement")
    }

    expectLog(
      "expect element `\(String(describing: element.cleanIdentifier))` " +
      "\(isTruthy ? "" : "not ")\(expectation)"
    )

    switch expectation {
      case .toHaveText(let text):
        try element.assertLabel(equals: text, isTruthy: isTruthy)

      case .toExist:
        try element.assertExists(isTruthy: isTruthy)
    }
  }
}