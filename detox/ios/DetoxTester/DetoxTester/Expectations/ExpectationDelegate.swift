//
//  ExpectationDelegate.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for expectations that can be performed on an element.
class ExpectationDelegate: ExpectationDelegateProtocol {
  let app: XCUIApplication
  let whiteBoxMessageHandler: WhiteBoxMessageHandler

  init(_ app: XCUIApplication, whiteBoxMessageHandler: @escaping WhiteBoxMessageHandler) {
    self.app = app
    self.whiteBoxMessageHandler = whiteBoxMessageHandler
  }

  /// Performs an expectation on an element.
  func expect(
    _ expectation: Expectation,
    isTruthy: Bool,
    on findElementHandler: () throws -> AnyHashable?,
    timeout: Double?
  ) throws {
    guard let timeoutMilliseconds = timeout else {
      let element = try findElementHandler() as? XCUIElement
      expectLog(
        "expect element `\(String(describing: element?.cleanIdentifier))` " +
        "\(isTruthy ? "" : "not ")\(expectation)"
      )

      try expect(expectation, isTruthy: isTruthy, on: element)
      return
    }

    expectLog(
      "expect element \(isTruthy ? "" : "not ")\(expectation), with timeout " +
      "of: \(timeoutMilliseconds) milliseconds"
    )

    // We add this grace interval to make amends for a delay in Detox's response to a change.
    let timeoutGrace: TimeInterval = 0.1
    let timeoutSeconds = TimeInterval(floatLiteral: timeoutMilliseconds / 1000.0)

    // Sample every 1/2 second, unless the timeout is shorter or very long (then we sample only
    //  10 times).
    let samplingInterval = max(min(timeoutSeconds, 0.5), timeoutSeconds / 10)

    let startDate = Date()

    // Keep checking the expectation until it passes or the timeout is reached.
    try checkExpectationUntilPass(
      expectation: expectation,
      isTruthy: isTruthy,
      findElementHandler: findElementHandler,
      timeoutGrace: timeoutGrace,
      timeoutSeconds: timeoutSeconds,
      samplingInterval: samplingInterval,
      startDate: startDate
    )
  }

  private func checkExpectationUntilPass(
    expectation: Expectation,
    isTruthy: Bool,
    findElementHandler: () throws -> AnyHashable?,
    timeoutGrace: TimeInterval,
    timeoutSeconds: TimeInterval,
    samplingInterval: TimeInterval,
    startDate: Date
  ) throws {
    while true {
      do {
        let element = try findElementHandler() as? XCUIElement
        expectLog("element found for expectation: \(String(describing: element))")

        try expect(expectation, isTruthy: isTruthy, on: element)
        break
      } catch {
        let secondsPassed = Date().timeIntervalSince(startDate)
        if secondsPassed > timeoutSeconds + timeoutGrace {
          throw Error.reachedExpectationTimeout(
            errorDescription: String(describing: error), timeout: timeoutSeconds)
        }

        expectLog(
          "expectation failed with error: `\(error)`, " +
          "retrying before reaching timeout after \(timeoutSeconds) seconds, " +
          "passed: \(secondsPassed) seconds.",
          type: .debug
        )

        Thread.sleep(forTimeInterval: samplingInterval)
        continue
      }
    }
  }

  private func expect(_ expectation: Expectation, isTruthy: Bool, on element: XCUIElement?) throws {
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

        let message = WhiteBoxExecutor.Message.verifyVisibility(
          ofElement: element,
          withThreshold: threshold
        )

        guard let response = whiteBoxMessageHandler(message) else {
          fatalError("Visibility expectation is not supported by the XCUITest target")
        }

        try response.assertResponse(
          equalsTo: WhiteBoxExecutor.Response.boolean(isTruthy),
          for: message
        )

      case .toHaveText(let text):
        guard let element = element else {
          throw Error.elementNotFound
        }

        let message = WhiteBoxExecutor.Message.verifyText(ofElement: element, equals: text)
        guard let response = whiteBoxMessageHandler(message) else {
          fatalError("Text expectation is not supported by the XCUITest target")
        }

        try response.assertResponse(
          equalsTo: WhiteBoxExecutor.Response.boolean(isTruthy),
          for: message
        )

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
