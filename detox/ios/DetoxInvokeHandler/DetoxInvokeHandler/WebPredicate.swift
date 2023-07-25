//
//  WebPredicate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Predicate of an inner web element.
public struct WebPredicate: Codable, Equatable {
  /// The predicate type.
  var type: WebPredicateType

  /// Value to compare to.
  var value: String
}
