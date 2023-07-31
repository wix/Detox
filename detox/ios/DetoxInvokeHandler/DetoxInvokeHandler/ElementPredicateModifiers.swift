//
//  ElementPredicateModifiers.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

/// Possible modifiers of a message predicate.
public enum ElementPredicateModifiers: String, Codable, Equatable {
  /// Negation modifier, expects the predicate expectation not to hold.
  case not = "not"
}