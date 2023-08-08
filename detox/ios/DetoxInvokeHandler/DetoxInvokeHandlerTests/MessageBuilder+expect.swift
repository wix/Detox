//
//  MessageBuilder+expectation.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Builders for expectations.
extension MessageBuilder {
  func expectToExist() -> Self {
    return expect(value: "toExist")
  }

  func waitUntilVisible(id: String) -> Self {
    message["while"] = MessageBuilder().setIdPredicate(id).expectToBeVisible().build()
    return self
  }

  func expectToHaveSliderPosition(position: Double) -> Self {
    return expectToHaveSliderPosition(position: position, tolerance: nil)
  }

  func expectToHaveSliderPosition(position: Double, tolerance: Double?) -> Self {
    message["params"] = tolerance != nil ? [position, tolerance!] : [position]

    return expect(value: "toHaveSliderPosition")
  }

  func expectToBeVisible() -> Self {
    return expectToBeVisible(nil)
  }

  func expectToBeVisible(_ threshold: Double?) -> Self {
    if threshold != nil {
      message["params"] = [threshold!]
    }

    return expect(value: "toBeVisible")
  }

  func expectToHaveText(_ text: String) -> Self {
    message["params"] = [text]

    return expect(value: "toHaveText")
  }

  func expectToHaveId(_ id: String) -> Self {
    message["params"] = [id]

    return expect(value: "toHaveId")
  }

  func expectToBeFocused() -> Self {
    return expect(value: "toBeFocused")
  }

  func negateExpectation() -> Self {
    message["modifiers"] = ["not"]

    return self
  }

  func webNegateExpectation() -> Self {
    message["webModifiers"] = ["not"]

    return self
  }

  fileprivate func expect(value: String) -> Self {
    message.merge([
      "type": "expectation",
      "expectation": value
    ]) {(_,new) in new}

    return self
  }
}
