//
//  WebExpectationDelegate.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import DetoxInvokeHandler
import Foundation
import XCTest

/// A delegate for expectations that can be performed on a web element.
class WebExpectationDelegate: WebExpectationDelegateProtocol {
  func expect(
    _ expectation: DetoxInvokeHandler.WebExpectation,
    isTruthy: Bool,
    on element: AnyHashable
  ) throws {
    fatalError("unsupported")
  }
}
