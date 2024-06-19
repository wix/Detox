//
//  ActionHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class ActionHandler {
  func handle(from params: InvocationParams, on element: XCUIElement) throws {

    let exists = element.waitForExistence(timeout: .defaultTimeout)
    DTXAssert(
      exists,
      "Action failed, element with matcher `\(params.matcherDescription)` does not exist"
    )

    guard let action = params.action else { return }
    switch action {
      case .tap:
        element.tap()

      case .typeText:
        guard let text = params.params?.first else {
          throw Error.missingTypeTextParam
        }

        element.typeTextOnEnd(text)

      case .replaceText:
        guard let text = params.params?.first else {
          throw Error.missingTypeTextParam
        }

        element.replaceText(text)

      case .clearText:
        element.clearText()
    }
  }
}

extension ActionHandler {
  enum Error: Swift.Error, LocalizedError {
    case missingTypeTextParam

    var errorDescription: String? {
      switch self {
        case .missingTypeTextParam:
          return "Missing text param for type action"
      }
    }
  }
}
