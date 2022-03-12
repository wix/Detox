//
//  WebSocketDelegateProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

///
protocol WebSocketDelegateProtocol: AnyObject {
  ///
  func webSocketDidConnect(_ webSocket: WebSocket)

  ///
  func webSocket(_ webSocket: WebSocket, didFailWith error: Error)

  ///
  func webSocket(
    _ webSocket: WebSocket,
    didReceiveAction type : String,
    params: [String: Any],
    messageId: NSNumber
  )

  ///
  func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?)
}
