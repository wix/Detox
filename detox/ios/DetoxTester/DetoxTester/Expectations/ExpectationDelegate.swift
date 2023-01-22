//
//  ExpectationDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for expectations that can be performed on an element.
/// TODO: requires refactoring.
class ExpectationDelegate: ExpectationDelegateProtocol {
  let app: XCUIApplication

  let whiteBoxMessageHandler: WhiteBoxMessageHandler

  init(_ app: XCUIApplication, whiteBoxMessageHandler: @escaping WhiteBoxMessageHandler) {
    self.app = app
    self.whiteBoxMessageHandler = whiteBoxMessageHandler
  }

  func expect(
    _ expectation: Expectation, isTruthy: Bool, on element: AnyHashable?, timeout: Double?
  ) throws {
    let element = element as? XCUIElement

    expectLog("expect \(String(describing: element)) \(isTruthy ? "" : "not ")\(expectation), " +
              "with timeout: \(String(describing: timeout))")

    switch expectation {
      case .toBeFocused:
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertIsFocused(isTruthy: isTruthy)

      case .toHaveId(let id):
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertIdentifier(equals: id, isTruthy: isTruthy)

      case .toHaveSliderInPosition(let normalizedPosition, let tolerance):
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertSlider(
          inNormalizedPosition: normalizedPosition,
          withTolerance: tolerance ?? 0,
          isTruthy: isTruthy
        )

      case .toExist:
        if element == nil && isTruthy == false {
          return
        }

        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertExists(isTruthy: isTruthy)

      case .toBeVisible(let threshold):
        if element == nil && isTruthy == false {
          return
        }

        guard let element = element else {
          throw Error.elementNotFound
        }

        let message = WhiteBoxExecutor.Message.verifyVisibility(ofElement: element, withThreshold: threshold)
        guard let response = whiteBoxMessageHandler(message) else {
          fatalError("Visibility expectation is not supported by the XCUITest target")
        }

        try response.assertResponse(equalsTo: .boolean(isTruthy), for: message)

      case .toHaveText(let text):
        guard let element = element else {
          throw Error.elementNotFound
        }

        let message = WhiteBoxExecutor.Message.verifyText(ofElement: element, equals: text)
        guard let response = whiteBoxMessageHandler(message) else {
          fatalError("Text expectation is not supported by the XCUITest target")
        }

        try response.assertResponse(equalsTo: .boolean(isTruthy), for: message)

      case .toHaveValue(let value):
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertValue(equals: value, isTruthy: isTruthy)

      case .toHaveLabel(let label):
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertLabel(equals: label, isTruthy: isTruthy)

      case .toHaveToggleValue(let value):
        guard let element = element else {
          throw Error.elementNotFound
        }

        try element.assertToggleValue(equals: value, isTruthy: isTruthy)
    }
  }
}

private extension XCUIElement {
  func assertExists(isTruthy: Bool) throws {
    if exists != isTruthy {
      expectLog(
        "element \(exists ? "is exist" : "is not exist"), expected: \(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "existence",
        expected: "truthy",
        actual: exists == true ? "truthy" : "falsy",
        not: isTruthy
      )
    }

    expectLog(
      "element \(exists ? "is exist" : "is not exist")"
    )
  }

  func assertIsFocused(isTruthy: Bool) throws {
    if hasFocus != isTruthy {
      expectLog(
        "element \(hasFocus ? "is focused" : "is not focused"), expected: \(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "focus",
        expected: "truthy",
        actual: hasFocus == true ? "truthy" : "falsy",
        not: isTruthy
      )
    }
  }

  func assertIdentifier(equals value: String, isTruthy: Bool) throws {
    let postfixRegex = try? NSRegularExpression(pattern: "_detox.*", options: .caseInsensitive)
    let cleanIdentifier = postfixRegex!.stringByReplacingMatches(
      in: identifier, range: NSMakeRange(0, identifier.count), withTemplate: "")

    let equalsId = cleanIdentifier == value

    if equalsId != isTruthy {
      expectLog(
        "element identifier \(equalsId ? "equals" : "does not equals") the expected identifier, " +
        "expected: \(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "identifier",
        expected: value,
        actual: cleanIdentifier,
        not: isTruthy
      )
    }

    expectLog(
      "element identifier \(equalsId ? "equals" : "does not equals") the expected identifier"
    )
  }

  func assertSlider(
    inNormalizedPosition position: Double,
    withTolerance tolerance: Double,
    isTruthy: Bool
  ) throws {
    let deviation = abs(normalizedSliderPosition - position)
    let isInRange = deviation <= tolerance

    if isInRange != isTruthy {
      expectLog(
        "slider position is \(isInRange ? "in" : "not in") accepted range, expected: " +
        "\(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "slider position",
        expected: "in range with normalized position `\(position)` and tolerance `\(tolerance)`",
        actual: "\(isInRange == true ? "in range" : "not in range") (`\(normalizedSliderPosition)`)",
        not: isTruthy
      )
    }

    expectLog("slider position deviation (\(deviation)) <= tolerance (\(tolerance))")
  }

  func assertValue(equals value: String, isTruthy: Bool) throws {
    let selfValue = String(
      describing: self.value as? CustomStringConvertible & TextOutputStreamable)
    let equals = selfValue == value

    if equals != isTruthy {
      expectLog(
        "element value \(equals ? "equals" : "does not equals") the expected value, " +
        "expected: \(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "value",
        expected: value,
        actual: selfValue,
        not: isTruthy
      )
    }

    expectLog(
      "element value \(equals ? "equals" : "does not equals") the expected value"
    )
  }

  func assertLabel(equals value: String, isTruthy: Bool) throws {
    let equals = self.label == value

    if equals != isTruthy {
      expectLog(
        "element label \(equals ? "equals" : "does not equals") the expected label, " +
        "expected: \(isTruthy.description)",
        type: .error
      )

      throw ExpectationDelegate.Error.expectationFailed(
        subject: "label",
        expected: value,
        actual: self.label,
        not: isTruthy
      )
    }

    expectLog(
      "element label \(equals ? "equals" : "does not equals") the expected label"
    )
  }

  func assertToggleValue(equals value: Bool, isTruthy: Bool) throws {
    try assertValue(equals: String(describing: value), isTruthy: isTruthy)
  }
}
