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
    case expectationFailed(subject: String, expected: String, actual: String, not: Bool)
  }
}

extension ExpectationDelegate.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .elementNotFound:
        return "Element was not found"

      case .expectationFailed(let subject, let expected, let actual, let not):
        return "Expectation failed, expected the element " +
            "\(not == true ? "not to" : "to") have \(subject) " +
            "with value: `\(expected)`, got: `\(actual)`"
    }
  }
}
