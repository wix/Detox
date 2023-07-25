//
//  ElementPredicateProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for basic predicate of a message.
protocol ElementPredicateProtocol: Codable, Hashable {
  /// Predicate type.
  var type: ElementPredicateType { get set }

  /// Predicate value, if needed.
  var value: AnyCodable? { get set }
}
