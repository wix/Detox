//
//  FakeWebExpectationDelegate.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

class FakeWebExpectationDelegate: WebExpectationDelegateProtocol {
  struct Error: Swift.Error { }

  var throwCount: UInt = 0

  private(set) var recorder: [(WebExpectation, Bool, AnyHashable?)] = []

  func expect(
    _ expectation: WebExpectation,
    isTruthy: Bool,
    on element: AnyHashable
  ) throws {
    recorder.append((expectation, isTruthy, element))

    if throwCount > 0 {
      throwCount -= 1
      throw Error()
    }
  }
}
