//
//  MessagePredicateType.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

/// Represents a message predicate type.
public enum MessagePredicateType: String, Codable, Hashable {
  /// Text predicate, expects the element's text to equal the specified `value`.
  case text = "text"

  /// Label predicate, expects the element's label to equal the specified `value`.
  case label = "label"

  /// Value predicate, expects the element's value to equal the specified `value`.
  case value = "value"

  /// And predicate, "and" composition of the predicates specified under `predicates`.
  case and = "and"

  /// ID predicate, expects the element's identifier to equal the specified `value`.
  case id = "id"

  /// Traits predicate, expects the element's traits to equal the specified `value`.
  case traits = "traits"

  /// Ancestor predicate, expects the element to have an ancestor with the state specified in
  /// `predicate`.
  case ancestor = "ancestor"

  /// Decendant predicate, expects the element to have a decendant with the state specified in
  /// `predicate`.
  case decendant = "decendant"
}
