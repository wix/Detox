//
//  XCUIElementQuery+matching.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
import XCTest

// TODO: extract to methods.

/// Extension to `XCUIElementQuery` that adds matching capabilities that uses the white-box handler of Detox
/// (which are not available in XCUITest).
extension XCUIElementQuery {
  /// Returns a new query matches the given pattern.
  func matching(
    pattern: ElementPattern, whiteBoxMessageHandler: WhiteBoxMessageHandler
  ) throws -> XCUIElementQuery {
    switch pattern {
      case .label(let label):
        return matching(parameter: .label, byOperator: .equals, toValue: label)

      case .value(let value):
        return matching(parameter: .value, byOperator: .equals, toValue: value)

      case .and(let patterns):
        var query = self
        for pattern in patterns {
          query = try query.matching(
            pattern: pattern,
            whiteBoxMessageHandler: whiteBoxMessageHandler
          )
        }
        return query

      case .id(let id):
        let predicate = NSPredicate { evaluatedObject, _ in
          guard
            let evaluatedObject = evaluatedObject as? NSObject,
            let identifier = evaluatedObject.value(forKey: "identifier") as? String
          else {
            execLog(
              "cannot run matching on a non UI element: `\(String(describing: evaluatedObject))`",
              type: .error
            )

            return false
          }

          return identifier == id || identifier.starts(with: "\(id)_detox:")
        }
        return matching(predicate)

      case .text(let text):
        let response = whiteBoxMessageHandler(.findElementsByText(text: text))
        guard let response = response else {
          execLog(
            "cannot match by this pattern (\(pattern)) type using the XCUITest framework`",
            type: .error
          )

          throw Error.cannotMatchByPattern(pattern: pattern)
        }

        guard case let .identifiersAndFrames(identifiersAndFrames) = response else {
          execLog("reponse for white-box is not [ElementIdentifierAndFrame]: \(response), " +
                  "failed to match the element", type: .info)
          return matchingNone()
        }

        execLog("found elements with text `\(text)`: \(identifiersAndFrames)")
        return matching(any: identifiersAndFrames)

      case .type(let type):
        let response = whiteBoxMessageHandler(.findElementsByType(type: type))
        guard let response = response else {
          execLog(
            "cannot match by this pattern (\(pattern)) type using the XCUITest framework`",
            type: .error
          )

          throw Error.cannotMatchByPattern(pattern: pattern)
        }

        guard case let .identifiersAndFrames(identifiersAndFrames) = response else {
          execLog("reponse for white-box is not [ElementIdentifierAndFrame]: \(response), " +
                  "failed to match the element", type: .info)
          return matchingNone()
        }

        execLog("found elements with type `\(type)`: \(identifiersAndFrames)")
        return matching(any: identifiersAndFrames)

      case .traits(let traits):
        let response = whiteBoxMessageHandler(.findElementsByTraits(traits: traits))
        guard let response = response else {
          execLog(
            "cannot match by this pattern (\(pattern)) type using the XCUITest framework`",
            type: .error
          )

          throw Error.cannotMatchByPattern(pattern: pattern)
        }

        guard case let .identifiersAndFrames(identifiersAndFrames) = response else {
          execLog("reponse for white-box is not [ElementIdentifierAndFrame]: \(response), " +
                  "failed to match the element", type: .info)
          return matchingNone()
        }

        execLog("found elements with traits `\(traits)`: \(identifiersAndFrames)")
        return matching(any: identifiersAndFrames)

      case .ancestor(let ancestorPattern):
        let ancestor = try matching(
          pattern: ancestorPattern,
          whiteBoxMessageHandler: whiteBoxMessageHandler
        )

        return ancestor.descendants(matching: .any)

      case .descendant(let descendantPattern):
        let matchingDescendants = try matching(
          pattern: descendantPattern,
          whiteBoxMessageHandler: whiteBoxMessageHandler
        ).run()

        return containing(NSPredicate { evaluatedObject, _ in
          guard
            let evaluatedObject = evaluatedObject as? NSObject,
            let identifier = evaluatedObject.value(forKey: "identifier") as? String,
            let frame = evaluatedObject.value(forKey: "frame") as? CGRect
          else {
            execLog(
              "cannot run matching on a non UI element: `\(String(describing: evaluatedObject))`",
              type: .error
            )

            return false
          }

          return matchingDescendants.contains {
            $0.identifier.elementsEqual(identifier) && $0.frame.equalTo(frame)
          }
        })
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

  /// Returns a new query that matches any element with the given identifiers.
  func matching(
    anyIdentifierFrom identifiers: [String]
  ) -> XCUIElementQuery {
    let predicate = NSPredicate { evaluatedObject, _ in
      guard
        let evaluatedObject = evaluatedObject as? NSObject,
        let identifier = evaluatedObject.value(forKey: "identifier") as? String
      else {
        execLog(
          "cannot run matching on a non UI element: `\(String(describing: evaluatedObject))`",
          type: .error
        )

        return false
      }

      return identifiers.contains(identifier)
    }

    return matching(predicate)
  }

  /// Returns a new query that matches any element with the given identifiers and frames.
  func matching(
    any identifiersAndFrame: [ElementIdentifierAndFrame]
  ) -> XCUIElementQuery {
    let predicate = NSPredicate { evaluatedObject, _ in
      guard
        let evaluatedObject = evaluatedObject as? NSObject,
        let identifier = evaluatedObject.value(forKey: "identifier") as? String
      else {
        execLog(
          "cannot run matching on a non UI element: `\(String(describing: evaluatedObject))`",
          type: .error
        )

        return false
      }

      let frame = NSCoder.string(for: evaluatedObject.value(forKey: "frame") as! CGRect)
      return identifiersAndFrame.contains(.init(identifier: identifier, frame: frame))
    }

    return matching(predicate)
  }

  func matchingNone() -> XCUIElementQuery {
    return matching(NSPredicate { _,_ in return false })
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
