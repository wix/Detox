//
//  DetoxXCUITestRunner.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import XCTest

final class DetoxXCUITestRunner: XCTestCase {
  var actionHandler: ActionHandler!
  var expectationHandler: ExpectationHandler!

  override func setUpWithError() throws {
    continueAfterFailure = false
    actionHandler = ActionHandler()
    expectationHandler = ExpectationHandler()
  }

  func testRunner() throws {
    let appUnderTest = try XCUIApplication.appUnderTest()
    appUnderTest.activate()

    let params = try InvocationParamsReader.readParams()

    let predicateHandler = PredicateHandler(
      springboardApp: XCUIApplication.springboard,
      appUnderTest: appUnderTest
    )

    let element = predicateHandler.findElement(using: params)

    switch params.type {
      case .systemAction, .webAction:
        try actionHandler.handle(from: params, on: element)

      case .systemExpectation, .webExpectation:
        try expectationHandler.handle(from: params, on: element)
    }
  }
}
