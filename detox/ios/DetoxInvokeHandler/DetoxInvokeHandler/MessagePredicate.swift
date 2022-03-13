//
//  MessagePredicate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

/// Predicate of a message.
public struct MessagePredicate: MessagePredicateProtocol, Equatable {
  var type: MessagePredicateType

  var value: AnyCodable?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [MessageSubPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` or `decendant` predicates
  /// for example).
  var predicate: MessageSubPredicate?
}

/// Sub-predicate, needed in case the message is consists of nested predicates.
public struct MessageSubPredicate: MessagePredicateProtocol, Equatable {
  var type: MessagePredicateType

  var value: AnyCodable?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [MessageSubSubPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` predicate type for example).
  var predicate: MessageSubSubPredicate?
}

/// Sub-sub-predicate, needed in case the message is consists of nested predicates.
public struct MessageSubSubPredicate: MessagePredicateProtocol, Equatable {
  var type: MessagePredicateType

  var value: AnyCodable?

  /// Underlying predicates, if there are any (when using `and` predicate type for example).
  var predicates: [MessageSubSubSubPredicate]?

  /// Underlying predicate, if there is any (when using `ancestor` predicate type for example).
  var predicate: MessageSubSubSubPredicate?
}

/// Sub-sub-sub-predicate, needed in case the message is consists of nested predicates.
public struct MessageSubSubSubPredicate: MessagePredicateProtocol, Equatable {
  var type: MessagePredicateType

  var value: AnyCodable?
}
