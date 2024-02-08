//
//  WebExpectationDelegateProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Protocol for classes that can be used as a delegate of `InvokeHandler`, in which handles
/// state expectations of a specified web element.
public protocol WebExpectationDelegateProtocol {
  /// Expects the given `element` to hold (or not) a certain state based on the provided
  /// `expectation` and the given `isTruthy` value.
  func expect(
    _ expectation: WebExpectation,
    isTruthy: Bool,
    on element: AnyHashable
  ) throws
}
