//
//  MessageBuilder.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Base class for all builder extensions.
class MessageBuilder {
  var message = [String: AnyHashable]()

  func build() -> [String: AnyHashable] {
    return message
  }

  func setTimeout(_ timeout: Double) -> MessageBuilder {
    message["timeout"] = timeout
    return self
  }
}
