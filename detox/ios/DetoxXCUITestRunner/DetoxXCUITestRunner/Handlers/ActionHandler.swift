//
//  ActionHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class ActionHandler {
  func handle(from params: InvocationParams, on element: XCUIElement) throws {
    guard let action = params.action else { return }
    switch action {
      case .tap:
        let exists = element.waitForExistence(timeout: .defaultTimeout)
        DTXAssert(
          exists,
          "Tap failed, element with matcher `\(params.matcherDescription)` does not exist"
        )

        element.tap()
    }
  }
}
