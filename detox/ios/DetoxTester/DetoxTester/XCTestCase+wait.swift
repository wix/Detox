//
//  XCTestCase+wait.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCTestCase {
  func wait(for seconds: TimeInterval) {
    let expectation = XCTestExpectation(description: "Wait for \(seconds)s")

    DispatchQueue.main.asyncAfter(deadline: .now() + seconds) {
      expectation.fulfill()
    }

    mainLog("waiting for \(seconds)s..")
    wait(for: [expectation], timeout: seconds + 1)
  }
}
