//
//  XCUIElement+isVisible.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension XCUIElement {
  /// Aliasing for `isHittable`.
  var isVisible: Bool { isHittable }
}
