//
//  ExpectationDelegate+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Extends `ExpectationDelegate` with error types.
extension ExpectationDelegate {
  /// An error that can be thrown by the expectation delegate.
  enum Error: Swift.Error {
    /// The element was not found.
    case elementNotFound

    /// The expectation failed.
    case expectationFailed(subject: String, expected: String, actual: String, isTruthy: Bool)

    /// The expectation timed out.
    case reachedExpectationTimeout(errorDescription: String, timeout: Double)
  }
}

/// Extends `ExpectationDelegate.Error` with a description.
extension ExpectationDelegate.Error: CustomStringConvertible {
  /// A description of the error.
  public var description: String {
    switch self {
      case .elementNotFound:
        return "Element was not found"

      case .expectationFailed(let subject, let expected, let actual, let isTruthy):
        return "Expectation failed, expected the element " +
            "\(isTruthy == true ? "to" : "not to") have \(subject) " +
            "with value: `\(expected)`, got: `\(actual)`"

      case .reachedExpectationTimeout(let errorDescription, let timeout):
        return "Reached expectation timeout (\(timeout) milliseconds), " +
            "with error: \(errorDescription)"
    }
  }
}
