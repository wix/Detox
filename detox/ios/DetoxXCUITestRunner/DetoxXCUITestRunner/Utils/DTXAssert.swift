//
//  DTXAssert.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

public func DTXAssert(_ assertion: Bool, _ message: String) {
  XCTAssert(
    assertion,
    "DTXError: \(message)"
  )
}
