//
//  WebSocketDelegateProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate for `WebSocket` connection.
protocol WebSocketDelegateProtocol: AnyObject {
  /// Called when the web-socket did connect.
  func webSocketDidConnect(_ webSocket: WebSocket)

  /// Called when the web-socket did fail.
  func webSocket(_ webSocket: WebSocket, didFailWith error: Error)

  /// Called when the web-socket did receive action.
  func webSocket(
    _ webSocket: WebSocket,
    didReceiveAction type : String,
    params: [String: Any],
    messageId: NSNumber
  )

  /// Called when the web-socket did close.
  func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?)
}
