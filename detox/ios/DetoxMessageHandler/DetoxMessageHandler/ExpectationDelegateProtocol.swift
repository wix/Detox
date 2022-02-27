//
//  ExpectationDelegateProtocol.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate of `MessageHandler`, in which handles
/// state expectations of a specified element.
public protocol ExpectationDelegateProtocol {
  /// Expects the given `element` to hold (or not) a certain state based on the provided
  /// `expectation` and the given `isTruthy` value.
  func expect(
    _ expectation: Expectation,
    isTruthy: Bool,
    on element: AnyHashable,
    timeout: Double?
  ) throws
}
