//
//  WhileMessage+defaultInstance.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

@testable import DetoxInvokeHandler

extension WhileMessage {
  /// Initializes a new while message with given parameters and default `nil` values.
  static func defaultInstance(
    type: WhileMessageType,
    expectation: ExpectationType,
    modifiers: [ElementPredicateModifiers]? = nil,
    atIndex: Int? = nil,
    params: [AnyCodable]? = nil,
    predicate: ElementPredicate
  ) -> WhileMessage {
    WhileMessage(
      type: type,
      expectation: expectation,
      modifiers: modifiers,
      atIndex: atIndex,
      params: params,
      predicate: predicate
    )
  }
}
