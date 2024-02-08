//
//  Executor+isReady.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension Executor {
  func isReady(messageId: NSNumber) throws {
    if isWhiteBoxExecutorAvailable() {
      let message = WhiteBoxExecutor.Message.waitUntilReady
      try execute(whiteBoxRequest: message).assertResponse(equalsTo: .completed, for: message)
    }

    sendAction(.reportReady, messageId: messageId)
  }
}
