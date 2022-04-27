//
//  Executor+sendAction.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

public extension Executor {
  /// Sends actions through the web-socket.
  func sendAction(
    _ type: WebSocketSendActionType,
    params: [String : AnyHashable],
    messageId: NSNumber
  ) {
    guard let delegate = delegate else {
      execLog("delegate is nil, cannot send action (\(type.rawValue)", type: .error)
      fatalError("Can't use nil delegate")
    }

    delegate.sendAction(type, params: params, messageId: messageId)
  }
}
