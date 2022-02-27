//
//  WhileMessage.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// While message, describes the expected condition for performing an action with another iteration.
public struct WhileMessage: Codable, Equatable {
  /// Message type (currently, only `expectation` is allowed).
  let type: WhileMessageType

  /// Expectation type.
  let expectation: ExpectationType

  /// Modifiers for the message predicate.
  let modifiers: [MessagePredicateModifiers]?

  /// Specifies the index of the element to perform on, in case of multiple elements matching.
  let atIndex: Int?

  /// Additional parameters of the action or expectation, if needed.
  let params: [AnyCodable]?

  /// Predicate of the message.
  let predicate: MessagePredicate
}

extension WhileMessage {
  /// Initializes the message from a given JSON `dictionary`.
  init(from dictionary: [String: AnyHashable]) throws {
    let data = try JSONSerialization.data(withJSONObject: dictionary)
    self = try JSONDecoder().decode(WhileMessage.self, from: data)
  }
}

extension WhileMessage {
  /// Represents the type of the message.
  enum WhileMessageType: String, Codable {
    /// Expectation type.
    case expectation = "expectation"
  }
}
