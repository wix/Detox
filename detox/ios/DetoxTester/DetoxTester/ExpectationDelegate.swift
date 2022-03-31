//
//  ExpectationDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ExpectationDelegate: ExpectationDelegateProtocol {
  static let shared = ExpectationDelegate()

  func expect(
    _ expectation: Expectation, isTruthy: Bool, on element: AnyHashable, timeout: Double?
  ) throws {
    guard let element = element as? XCUIElement else {
      throw Error.notXCUIElement
    }

    expectLog("expect \(element) \(isTruthy ? "" : "NOT ")\(expectation), with timeout: \(timeout)")

    switch expectation {
      case .toBeVisible(let threshold):
        XCTAssertEqual(element.isHittable, isTruthy)

      case .toBeFocused:
        XCTAssertEqual(element.accessibilityElementIsFocused(), isTruthy)

      case .toHaveText(let text):
        let predicate = NSPredicate(format: "label CONTAINS[c] %@", text)
        XCTAssertEqual(element.staticTexts.containing(predicate).count > 0, isTruthy)

      case .toHaveId(let id):
        XCTAssertEqual(element.identifier == id, isTruthy)

      case .toHaveSliderInPosition(let normalizedPosition, let tolerance):
        XCTAssertLessThanOrEqual(element.normalizedSliderPosition, normalizedPosition + (tolerance ?? 0))
        XCTAssertGreaterThanOrEqual(element.normalizedSliderPosition, normalizedPosition - (tolerance ?? 0))

      case .toExist:
        XCTAssertEqual(element.exists, isTruthy)
    }
  }
}

extension ExpectationDelegate {
  enum Error: Swift.Error {
    case notXCUIElement
  }
}
