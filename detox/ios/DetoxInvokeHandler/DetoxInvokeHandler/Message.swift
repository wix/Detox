//
//  Message.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Structure of messages sent to `InvokeHandler`.
struct Message: Codable, Equatable {
  /// Type of the message.
  let type: MessageType

  /// Type of the action to perform, needs to be specified if the message `type` is
  /// `MessageType.action`.
  let action: ActionType?

  /// Type of the expectation to assert, needs to be specified if the message `type` is
  /// `MessageType.expectation`.
  let expectation: ExpectationType?

  /// Type of the action to perform, needs to be specified if the message `type` is
  /// `MessageType.webAction`.
  let webAction: WebActionType?

  /// Type of the expectation to assert, needs to be specified if the message `type` is
  /// `MessageType.webExpectation`.
  let webExpectation: WebExpectationType?

  /// Modifiers of the message predicate.
  let modifiers: [ElementPredicateModifiers]?

  /// Modifiers of the web predicate.
  let webModifiers: [WebPredicateModifiers]?

  /// Specifies the index of the element to perform on, in case of multiple elements matching.
  let atIndex: Int?

  /// Specifies the index of the web element to perform on, in case of multiple web elements
  /// matching.
  let webAtIndex: Int?

  /// Additional parameters of the action or expectation, if needed.
  let params: [AnyCodable]?

  /// Predicate of the message, representing the element to perform on.
  let predicate: ElementPredicate?

  /// Predicate of the inner web element if exists (in case of message from types `webAction` or
  /// `webExpectation`).
  let webPredicate: WebPredicate?

  /// Target element of the action, if exists.
  let targetElement: TargetElement?

  /// Represents a while condition, specified in case of action request, that should be performed
  /// until the condition is fulfilled.
  let `while`: WhileMessage?

  /// Timeout of the expectation.
  let timeout: TimeInterval?
}

extension Message {
  /// Initializes the message from a given JSON `dictionary`.
  init(from dictionary: [String: AnyHashable]) throws {
    let data = try JSONSerialization.data(withJSONObject: dictionary)
    self = try JSONDecoder().decode(Message.self, from: data)
  }
}

extension Message {
  /// Represents the type of the message.
  enum MessageType: String, Codable {
    /// Action type.
    case action = "action"

    /// Expectation type.
    case expectation = "expectation"

    /// Web action type.
    case webAction = "webAction"

    /// Web expectation type.
    case webExpectation = "webExpectation"
  }
}

extension Message {
  /// Convenience alias for `while` property.
  var whileMessage: WhileMessage? {
    return `while`
  }
}
