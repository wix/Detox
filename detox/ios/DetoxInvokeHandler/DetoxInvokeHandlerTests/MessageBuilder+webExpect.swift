//
//  MessageBuilder+webExpect.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Builders for expectations.
extension MessageBuilder {
  func webExpectToExist() -> Self {
    return webExpect(value: "toExist")
  }

  func webExpectToHaveText(_ text: String) -> Self {
    message["params"] = [text]
    return webExpect(value: "toHaveText")
  }

  fileprivate func webExpect(value: String) -> Self {
    message.merge([
      "type": "webExpectation",
      "webExpectation": value
    ]) {(_,new) in new}

    return self
  }
}
