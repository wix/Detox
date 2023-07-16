//
//  MessagePredicateProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for basic predicate of a message.
protocol MessagePredicateProtocol: Codable, Hashable {
  /// Predicate type.
  var type: MessagePredicateType { get set }

  /// Predicate value, if needed.
  var value: AnyCodable? { get set }
}
