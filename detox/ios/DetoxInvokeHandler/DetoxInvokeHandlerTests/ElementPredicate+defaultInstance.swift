//
//  ElementPredicate+defaultInstance.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

@testable import DetoxInvokeHandler

extension ElementPattern {
  /// Initializes a new predicate with given parameters and default `nil` values.
  static func defaultInstance(
    type: ElementPredicateType,
    value: AnyCodable? = nil,
    isRegex: Bool? = nil,
    predicates: [SubElementPredicate]? = nil,
    predicate: SubElementPredicate? = nil
  ) -> ElementPredicate {
    ElementPredicate(
      type: type,
      value: value,
      isRegex: isRegex,
      predicates: predicates,
      predicate: predicate
    )
  }
}

extension SubElementPredicate {
  /// Initializes a new predicate with given parameters and default `nil` values.
  static func defaultInstance(
    type: ElementPredicateType,
    value: AnyCodable? = nil,
    isRegex: Bool? = nil,
    predicates: [SubSubElementPredicate]? = nil,
    predicate: SubSubElementPredicate? = nil
  ) -> SubElementPredicate {
    SubElementPredicate(
      type: type,
      value: value,
      isRegex: isRegex,
      predicates: predicates,
      predicate: predicate
    )
  }
}

extension SubSubElementPredicate {
  /// Initializes a new predicate with given parameters and default `nil` values.
  static func defaultInstance(
    type: ElementPredicateType,
    value: AnyCodable? = nil,
    isRegex: Bool? = nil,
    predicates: [SubSubSubElementPredicate]? = nil,
    predicate: SubSubSubElementPredicate? = nil
  ) -> SubSubElementPredicate {
    SubSubElementPredicate(
      type: type,
      value: value,
      isRegex: isRegex,
      predicates: predicates,
      predicate: predicate
    )
  }
}

extension SubSubSubElementPredicate {
  /// Initializes a new predicate with given parameters and default `nil` values.
  static func defaultInstance(
    type: ElementPredicateType,
    value: AnyCodable? = nil,
    isRegex: Bool? = nil
  ) -> SubSubSubElementPredicate {
    SubSubSubElementPredicate(
      type: type,
      value: value,
      isRegex: isRegex
    )
  }
}
