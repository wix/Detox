//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Used for observing Detox web-socket and handling the received messages from the server.
@objc public class DetoxTester: NSObject, WebSocketDelegate {
  private static var shared : DetoxTester = {
    return DetoxTester()
  }()

  @objc static public func startDetoxTesting() {
    mainLog("starting detox tester")
    shared.start()
  }

  private var webSocket: WebSocket?

  private var done: (() -> Void)?

  func start() {
    WaitUntilDone { [self] done in
      self.webSocket = makeWebSocket()
      self.done = done
    }
  }

  private func makeWebSocket() -> WebSocket {
    let webSocket: WebSocket = WebSocket()
    webSocket.delegate = self

    webSocket.connect(
      toServer: URL(string: WebSocket.detoxServer())!,
      withSessionId: WebSocket.detoxSessionId()
    )

    mainLog("web-socket connection started")

    return webSocket
  }

  func webSocketDidConnect(_ webSocket: WebSocket) {
    mainLog("web-socket did-connect")
  }

  func webSocket(_ webSocket: WebSocket, didFailWith error: Error) {
    mainLog("web-socket failed with error: \(error.localizedDescription)", type: .error)
    fatalError("web-socket did fail with error: \(error.localizedDescription)")
  }

  func webSocket(
    _ webSocket: WebSocket,
    didReceiveAction type: String,
    params: [String : Any],
    messageId: NSNumber
  ) {
    mainLog("web-socket received `\(type)` action message (\(messageId.stringValue), " +
            "with params: \(params.description)")
  }

  func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?) {
    guard let done = self.done else {
      mainLog("unexpected call to close web-socket connection", type: .error)
      fatalError("unexpected call to close web-socket connection, Detox is already done")
    }

    mainLog("web-socket connection did close")
    done()
  }
}
