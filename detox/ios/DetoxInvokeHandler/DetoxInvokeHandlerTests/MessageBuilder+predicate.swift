//
//  MessageBuilder+predicate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Builders for predicates.
extension MessageBuilder {
  func at(index: UInt) -> Self {
    message["atIndex"] = index
    return self
  }

  func setTextPredicate(_ value: String, _ isRegex: Bool? = nil) -> Self {
    return setPredicate("text", value, isRegex)
  }

  func setIdPredicate(_ value: String, _ isRegex: Bool? = nil) -> Self {
    return setPredicate("id", value, isRegex)
  }

  func setLabelPredicate(_ value: String, _ isRegex: Bool? = nil) -> Self {
    return setPredicate("label", value, isRegex)
  }

  func setValuePredicate(_ value: String, _ isRegex: Bool? = nil) -> Self {
    return setPredicate("value", value, isRegex)
  }

  func setChildWithAncestorPredicate(_ childID: String, _ parentID: String) -> Self {
    let childPredicate: [String: AnyHashable] = [
      "type": "id",
      "value": childID
    ]

    let ancestorPredicate: [String: AnyHashable] = [
      "type": "ancestor",
      "predicate": [
        "type": "id",
        "value": parentID
      ]
    ]

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": [
        childPredicate,
        ancestorPredicate
      ]
    ]

    message["predicate"] = predicate
    return self
  }

  func setParentWithDescendantPredicate(_ parentID: String, _ childId: String) -> Self {
    let parentPredicate: [String: AnyHashable] = [
      "type": "id",
      "value": parentID
    ]

    let descendantPredicate: [String: AnyHashable] = [
      "type": "descendant",
      "predicate": [
        "type": "id",
        "value": childId
      ]
    ]

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": [
        parentPredicate,
        descendantPredicate
      ]
    ]

    message["predicate"] = predicate
    return self
  }

  func setTraitsPredicate(_ values: [String]) -> Self {
    let predicate: [String: AnyHashable] = [
      "type": "traits",
      "value": values
    ]

    message["predicate"] = predicate
    return self
  }

  func setAndPredicates(_ predicates: [(type: String, value: String)]) -> Self {
    var predicatesList: [[String: String]] = []
    for predicate in predicates {
      predicatesList.append([
        "type": predicate.type,
        "value": predicate.value
      ])
    }

    let predicate: [String: AnyHashable] = [
      "type": "and",
      "predicates": predicatesList
    ]

    message["predicate"] = predicate
    return self
  }

  func setTypePredicate(_ value: String, _ isRegex: Bool? = nil) -> Self {
    return setPredicate("type", value, isRegex)
  }

  fileprivate func setPredicate(_ type: String, _ value: String, _ isRegex: Bool? = nil) -> Self {
    let predicate: [String: AnyHashable] = [
      "type": type,
      "value": value,
      "isRegex": isRegex
    ]
    message["predicate"] = predicate
    return self
  }
}
