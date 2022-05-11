//
//  WebSocketDelegateProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `WebSocketClient` connection.
protocol WebSocketDelegateProtocol: AnyObject {
  /// Called when the web-socket did connect.
  func webSocketDidConnect(_ webSocket: WebSocketClient)

  /// Called when the web-socket did fail.
  func webSocket(_ webSocket: WebSocketClient, didFailWith error: Error)

  /// Called when the web-socket did receive action.
  func webSocket(
    _ webSocket: WebSocketClient,
    didReceiveMessage type: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  )

  /// Called when the web-socket did close.
  func webSocket(_ webSocket: WebSocketClient, didCloseWith reason: String?)
}
