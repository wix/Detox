//
//  FakeExpectationDelegate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

class FakeExpectationDelegate: ExpectationDelegateProtocol {
  struct Error: Swift.Error { }

  var throwCount: UInt = 0

  private(set) var recorder: [(Expectation, Bool, AnyHashable, Double?)] = []

  func expect(
    _ expectation: Expectation,
    isTruthy: Bool,
    on element: AnyHashable,
    timeout: Double?
  ) throws {
    recorder.append((expectation, isTruthy, element, timeout))

    if throwCount > 0 {
      throwCount -= 1
      throw Error()
    }
  }
}
