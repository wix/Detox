//
//  ExpectationDelegate+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension ExpectationDelegate {
  ///
  enum Error: Swift.Error {
    ///
    case elementNotFound

    ///
    case expectationFailed(subject: String, expected: String, actual: String, isTruthy: Bool)

    ///
    case reachedExpectationTimeout(errorDescription: String, timeout: Double)
  }
}

extension ExpectationDelegate.Error: CustomStringConvertible {
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
