//
//  XCUIElement+assertions.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

// Extends `XCUIElement` with assertions.
extension XCUIElement {
  /// Asserts whether the element exists or not.
  func assertExists(isTruthy: Bool) throws {
    try assertProperty("existence", expected: isTruthy, actual: exists)
  }

  /// Asserts whether the element is focused or not.
  func assertIsFocused(isTruthy: Bool) throws {
    try assertProperty("focus", expected: isTruthy, actual: hasKeyboardFocusOnTextField)
  }

  /// Asserts whether the element's identifier equals the expected value.
  func assertIdentifier(equals value: String, isTruthy: Bool) throws {
    let equalsId = cleanIdentifier == value
    try assertProperty(
      "identifier",
      expected: isTruthy,
      actual: equalsId,
      expectedValue: value,
      actualValue: cleanIdentifier
    )
  }

  /// Asserts whether the slider element is in the expected position.
  func assertSlider(
    inNormalizedPosition position: Double,
    withTolerance tolerance: Double,
    isTruthy: Bool
  ) throws {
    let deviation = abs(normalizedSliderPosition - position)
    let isInRange = deviation <= tolerance
    try assertProperty(
      "slider position",
      expected: isTruthy,
      actual: isInRange,
      expectedValue: "in range with normalized position `\(position)` and tolerance `\(tolerance)`",
      actualValue: "\(isInRange ? "in range" : "not in range") (`\(normalizedSliderPosition)`)"
    )
  }

  /// Asserts whether the element value equals the expected value.
  func assertValue(equals value: String, isTruthy: Bool) throws {
    let selfValue = accessibilityValue ?? self.value as? String
    let equals = selfValue == value

    try assertProperty(
      "value",
      expected: isTruthy,
      actual: equals,
      expectedValue: value,
      actualValue: selfValue
    )
  }

  /// Asserts whether the element label equals the expected value.
  func assertLabel(equals value: String, isTruthy: Bool) throws {
    let selfLabel = accessibilityLabel ?? label
    let equals = selfLabel == value

    try assertProperty(
      "label",
      expected: isTruthy,
      actual: equals,
      expectedValue: value,
      actualValue: selfLabel
    )
  }

  /// Asserts whether the element value describes a boolean value that equals the expected value.
  func assertToggleValue(equals value: Bool, isTruthy: Bool) throws {
    try assertValue(equals: String(describing: value), isTruthy: isTruthy)
  }
}

// Extends `XCUIElement` with private helpers for logging and error throwing.
fileprivate extension XCUIElement {
  func generateExpectationFailedError(
    subject: String,
    expected: String,
    actual: String,
    isTruthy: Bool
  ) -> Swift.Error {
    ExpectationDelegate.Error.expectationFailed(
      subject: subject,
      expected: expected,
      actual: actual,
      isTruthy: isTruthy
    )
  }

  func assertProperty(
    _ propertyName: String,
    expected: Bool,
    actual: Bool,
    expectedValue: String? = nil,
    actualValue: String? = nil
  ) throws {
    if actual != expected {
      let message = "element \(propertyName) \(actualValue.map { "\($0) " } ?? "")" +
        "\(actual ? "matches" : "does not match") the expected value " +
        "(\(expectedValue.map { "\($0) " } ?? "")), " +
        "but was expected to \(expected ? "match" : "not match")"
      expectLog(message, type: .error)

      throw generateExpectationFailedError(
        subject: propertyName,
        expected: expected ? "truthy" : "falsy",
        actual: actual ? "truthy" : "falsy",
        isTruthy: expected
      )
    }

    let message = "element \(propertyName) \(actualValue.map { "\($0) " } ?? "")" +
      "\(actual ? "matches" : "does not match") the expected value " +
      "(\(expectedValue.map { "\($0) " } ?? "")), as expected"
    expectLog(message)
  }
}
