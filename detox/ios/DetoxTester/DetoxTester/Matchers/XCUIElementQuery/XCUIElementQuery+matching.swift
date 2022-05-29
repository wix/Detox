//
//  XCUIElementQuery+matching.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

extension XCUIElementQuery {
  /// Returns a new query matches the given pattern.
  func matching(
    pattern: ElementPattern, whiteBoxMessageHandler: WhiteBoxMessageHandler
  ) -> XCUIElementQuery {
    switch pattern {
      case .label(let label):
        return matching(parameter: .label, byOperator: .equals, toValue: label)

      case .value(let value):
        return matching(parameter: .value, byOperator: .equals, toValue: value)

      case .and(let patterns):
        var query = self
        for pattern in patterns {
          query = query.matching(pattern: pattern, whiteBoxMessageHandler: whiteBoxMessageHandler)
        }
        return query

      case .id(let id):
        return matching(parameter: .id, byOperator: .equals, toValue: id)

      case .text(let text):
        let response = whiteBoxMessageHandler(.findElementIDByText(text: text))
        guard let response = response else {
          fatalError("Cannot match by this pattern (\(pattern)) type using the XCUITest framework")
        }

        guard case let .string(id) = response else {
          execLog("reponse for white-box is not a string: \(response)", type: .error)
          fatalError("Reponse is not a string: \(response)")
        }

        execLog("found identifier for element with text (\(text)): \(id)")
        return matching(parameter: .id, byOperator: .equals, toValue: id)

      case .type, .traits, .ancestor, .descendant:
        fatalError("Cannot match by this pattern (\(pattern)) type using the XCUITest framework")
    }
  }
}

private extension XCUIElementQuery {
  /// Returns a new query matches descendants elements by `parameter` `value`, using comparison
  /// `operator`.
  ///
  /// For example, `match(parameter: .label, byOperator: .endsWith, toValue: "foo")` will
  ///  return a new query that matches all descendants elements that their label ends with "foo".
  func matching(
    parameter: ComparisonParameter,
    byOperator `operator`: ComparisonOperator,
    toValue value: String
  ) -> XCUIElementQuery {
    let predicate = NSPredicate(format: "\(parameter.rawValue) \(`operator`.rawValue) %@", value)
    return matching(predicate)
  }

  enum ComparisonParameter: String {
    case label = "label"
    case id = "identifier"
    case value = "value"
  }

  enum ComparisonOperator: String {
    case equals = "=="
    case startsWith = "BEGINSWITH"
    case contains = "CONTAINS"
    case endsWith = "ENDSWITH"
    case like = "LIKE"
    case matches = "MATCHES"
  }
}
