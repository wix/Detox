//
//  ExpectationDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ExpectationDelegate: ExpectationDelegateProtocol {
  let app: XCUIApplication

  init(_ app: XCUIApplication) {
    self.app = app
  }

  func expect(
    _ expectation: Expectation, isTruthy: Bool, on element: AnyHashable, timeout: Double?
  ) throws {
    guard let element = element as? XCUIElement else {
      throw Error.notXCUIElement
    }

    expectLog("expect \(element) \(isTruthy ? "" : "not ")\(expectation), " +
              "with timeout: \(String(describing: timeout))")

    switch expectation {
      case .toBeFocused:
        XCTAssertEqual(element.accessibilityElementIsFocused(), isTruthy)

      case .toHaveId(let id):
        let equalsId = element.identifier == id
        XCTAssertEqual(equalsId, isTruthy)

      case .toHaveSliderInPosition(let normalizedPosition, let tolerance):
        let deviation = abs(element.normalizedSliderPosition - normalizedPosition)
        XCTAssertLessThanOrEqual(deviation, tolerance ?? 0)

      case .toExist:
        XCTAssertEqual(element.exists, isTruthy)

      case .toBeVisible(_):
        fatalError("Visibility expectation is not supported by the XCUITest target")

      case .toHaveText(_):
        fatalError("Text expectation is not supported by the XCUITest target")
    }
  }
}

extension ExpectationDelegate {
  enum Error: Swift.Error {
    case notXCUIElement
  }
}
