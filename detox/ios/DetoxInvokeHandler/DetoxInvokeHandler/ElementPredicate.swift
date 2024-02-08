//
//  ElementPredicate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

/// Predicate of a message.
public struct ElementPredicate: ElementPredicateProtocol, Equatable {
  /// The predicate type.
  var type: ElementPredicateType

  /// Value to compare to.
  var value: AnyCodable?

  /// Indicates whether the predicate value is a regular expression.
  var isRegex: Bool?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [SubElementPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` or `descendant` predicates
  /// for example).
  var predicate: SubElementPredicate?
}

/// Sub-predicate, needed in case the message is consists of nested predicates.
public struct SubElementPredicate: ElementPredicateProtocol, Equatable {
  /// The predicate type.
  var type: ElementPredicateType

  /// Value to compare to.
  var value: AnyCodable?

  /// Indicates whether the predicate value is a regular expression.
  var isRegex: Bool?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [SubSubElementPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` predicate type for example).
  var predicate: SubSubElementPredicate?
}

/// Sub-sub-predicate, needed in case the message is consists of nested predicates.
public struct SubSubElementPredicate: ElementPredicateProtocol, Equatable {
  /// The predicate type.
  var type: ElementPredicateType

  /// Value to compare to.
  var value: AnyCodable?

  /// Indicates whether the predicate value is a regular expression.
  var isRegex: Bool?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [SubSubSubElementPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` predicate type for example).
  var predicate: SubSubSubElementPredicate?
}

/// Sub-sub-sub-predicate, needed in case the message is consists of nested predicates.
public struct SubSubSubElementPredicate: ElementPredicateProtocol, Equatable {
  /// The predicate type.
  var type: ElementPredicateType

  /// Value to compare to.
  var value: AnyCodable?

  /// Indicates whether the predicate value is a regular expression.
  var isRegex: Bool?
}
