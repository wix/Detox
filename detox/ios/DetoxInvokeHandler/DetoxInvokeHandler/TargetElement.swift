//
//  TargetElement.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Represent the target element of the action.
public struct TargetElement: Codable, Hashable, Equatable {
  /// Predicate of the target element.
  let predicate: ElementPredicate
}
