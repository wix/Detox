//
//  ExecutorDelegateProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `Executor`.
public protocol ExecutorDelegateProtocol: AnyObject {
  /// Send action.
  func sendAction(
    _ type: WebSocketSendActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  )

  /// Do cleanup of Detox tester.
  func cleanup()
}
