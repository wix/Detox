//
//  ExpectationHandler.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

class ExpectationHandler {
  func handle(from params: InvocationParams, predicateHandler: PredicateHandler) throws {
    guard let expectation = params.expectation else {
      throw Error.invalidInvocationParams("Expectation type is missing")
    }

    let element = predicateHandler.findElement(using: params)
    let expectedEvaluation = expectedEvaluation(params)

    switch expectation {
      case .exists:
        assert(
          expected: expectedEvaluation,
          actual: element.waitForExistence(timeout: .defaultTimeout),
          matcherDescription: params.matcherDescription,
          evaluationDescription: "exist"
        )
    }
  }

  private func expectedEvaluation(_ params: InvocationParams) -> Bool {
    let modifiers = params.expectationModifiers ?? []
    let shouldNegate = modifiers.contains(.not)
    return !shouldNegate
  }

  private func assert(
    expected: Bool,
    actual: Bool,
    matcherDescription: String,
    evaluationDescription: String
  ) {
    DTXAssert(
      expected == actual,
      "Expectation failed, element with matcher `\(matcherDescription)` " +
        "does \(actual ? "" : "not ")\(evaluationDescription)"
    )
  }
}

extension ExpectationHandler {
  enum Error: Swift.Error, LocalizedError {
    case invalidInvocationParams(String)

    var errorDescription: String? {
      switch self {
        case .invalidInvocationParams(let message):
          return "Invalid invocation parameters: \(message)"
      }
    }
  }
}
