//
//  TimeInterval+defaultTimeout.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

extension TimeInterval {
  /// Default timeout for assertions.
  static var defaultTimeout: TimeInterval {
    return 1
  }
}
