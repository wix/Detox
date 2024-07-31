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

      case .coordinateTap:
            guard let x = params.params?.first, let y = params.params?[1] else {
                throw Error.missingTypeTextParam
            }

            do {
                // create the normalized vector:
                let width = try XCUIApplication.appUnderTest().frame.width
                // ...
                let normalizedVector = CGVector(dx: 0.2, dy: 0.3)
                let coordinate = try XCUIApplication.appUnderTest().coordinate(withNormalizedOffset: normalizedVector)

                coordinate.tap()
            } catch  {
                throw Error.failedToFindApp
            }
    }
  }
}

extension ActionHandler {
  enum Error: Swift.Error, LocalizedError {
    case missingTypeTextParam
    case failedToFindApp

    var errorDescription: String? {
      switch self {
        case .missingTypeTextParam:
          return "Missing text param for type action"

          case .failedToFindApp:
              return "Failed to find app under test"
      }
    }
  }
}
