//
//  ElementMatcher.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a matcher for `InvokeHandler`, in which handles
/// elements matching based on given `pattern`.
public protocol ElementMatcherProtocol {
  /// Returns elements that matches the given `pattern`.
  func match(to pattern: ElementPattern) throws -> [AnyHashable]
}
