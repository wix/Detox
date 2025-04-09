//
//  ActionHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class ActionHandler {

  func findElement(from params: InvocationParams, predicateHandler: PredicateHandler) -> XCUIElement {
    let element = predicateHandler.findElement(using: params)
    let exists = element.waitForExistence(timeout: .defaultTimeout)
    DTXAssert(
      exists,
      "Action failed, element with matcher `\(params.matcherDescription)` does not exist"
    )
    return element
  }

  func getNormalizedCoordinate(from params: InvocationParams) throws -> XCUICoordinate {
    let x = Int(params.params?.first ?? "100") ?? 100
    let y = Int(params.params?[1] ?? "100") ?? 100
    
    let appUnderTest = try XCUIApplication.appUnderTest()
    let screenFrame = appUnderTest.frame
    let normalizedX = CGFloat(x) / screenFrame.width
    let normalizedY = CGFloat(y) / screenFrame.height
    let normalizedPoint = CGVector(dx: normalizedX, dy: normalizedY)
    let coordinate = appUnderTest.coordinate(
      withNormalizedOffset: normalizedPoint)

    return coordinate
  }
    
  func handle(from params: InvocationParams, predicateHandler: PredicateHandler) throws {
      
    guard let action = params.action else { return }
    switch action {
      case .tap:
        let element = findElement(from: params, predicateHandler: predicateHandler);
        element.tap()

      case .typeText:
        guard let text = params.params?.first else {
          throw Error.missingTypeTextParam
        }

        let element = findElement(from: params, predicateHandler: predicateHandler);
        element.typeTextOnEnd(text)

      case .replaceText:
        guard let text = params.params?.first else {
          throw Error.missingTypeTextParam
        }

        let element = findElement(from: params, predicateHandler: predicateHandler);
        element.replaceText(text)

      case .clearText:
        let element = findElement(from: params, predicateHandler: predicateHandler);
        element.clearText()
        
      case .coordinateTap:
        do {
            try getNormalizedCoordinate(from: params).tap();
        } catch  {
            throw Error.failedToTapDeviceByCoordinates
        }
      case .coordinateLongPress:
        guard let pressDuration = Double(params.params?[2] ?? "1") else { throw Error.missingTypeTextParam
        }
        
        do {
            try getNormalizedCoordinate(from: params).press(forDuration: pressDuration);
        } catch  {
            throw Error.failedToTapDeviceByCoordinates
        }
    }
  }
}

extension ActionHandler {
  enum Error: Swift.Error, LocalizedError {
    case missingTypeTextParam
    case failedToTapDeviceByCoordinates

    var errorDescription: String? {
      switch self {
        case .missingTypeTextParam:
          return "Missing text param for type action"
        case .failedToTapDeviceByCoordinates:
          return "Failed to perform tap action by coordinates"
        }
    }
  }
}
