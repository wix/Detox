//
//  Executor+sendAction.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Sends actions through the web-socket.
  func sendAction(
    _ type: ResponseMessageType,
    params: [String : Any] = [:],
    messageId: NSNumber
  ) {
    guard let serverMessageSender = serverMessageSender else {
      execLog("`serverMessageSender` is nil, cannot send action (\(type.rawValue)", type: .error)
      fatalError("Can't use nil message handler")
    }

    serverMessageSender.sendAction(type, params: params, messageId: messageId)
  }
}
