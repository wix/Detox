//
//  Message+defaultInstance.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

@testable import DetoxInvokeHandler

extension Message {
  /// Initializes a new message with given parameters and default `nil` values.
  static func defaultInstance(
    type: MessageType,
    action: ActionType? = nil,
    expectation: ExpectationType? = nil,
    webAction: WebActionType? = nil,
    webExpectation: WebExpectationType? = nil,
    modifiers: [ElementPredicateModifiers]? = nil,
    webModifiers: [WebPredicateModifiers]? = nil,
    atIndex: Int? = nil,
    webAtIndex: Int? = nil,
    params: [AnyCodable]? = nil,
    predicate: ElementPredicate? = nil,
    webPredicate: WebPredicate? = nil,
    targetElement: TargetElement? = nil,
    `while`: WhileMessage? = nil,
    timeout: TimeInterval? = nil
  ) -> Message {
    Message(
      type: type,
      action: action,
      expectation: expectation,
      webAction: webAction,
      webExpectation: webExpectation,
      modifiers: modifiers,
      webModifiers: webModifiers,
      atIndex: atIndex,
      webAtIndex: webAtIndex,
      params: params,
      predicate: predicate,
      webPredicate: webPredicate,
      targetElement: targetElement,
      while: `while`,
      timeout: timeout
    )
  }
}
