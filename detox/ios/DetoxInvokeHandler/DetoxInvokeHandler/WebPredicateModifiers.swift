//
//  WebPredicateModifiers.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Possible modifiers of a web predicate.
public enum WebPredicateModifiers: String, Codable, Equatable {
  /// Negation modifier, expects the predicate expectation not to hold.
  case not = "not"
}
