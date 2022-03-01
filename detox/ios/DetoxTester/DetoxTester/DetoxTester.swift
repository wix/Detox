//
//  DetoxTester.swift (DetoxTesterApp)
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
    shared.start()
  }

  private var webSocket: WebSocket?

  private var done: (() -> Void)?

  func start() {
    WaitUntilDone { [self] done in
      self.webSocket = makeWebSocket()
      self.done = done


      let app = XCUIApplication(bundleIdentifier: "com.wix.detox-example")
      app.launch()
    }
  }

  private func makeWebSocket() -> WebSocket {
    let webSocket: WebSocket = WebSocket()
    webSocket.delegate = self
    webSocket.connect(
      toServer: URL(string: .detoxServer())!,
      withSessionId: String.detoxSessionId()
    )

    return webSocket
  }

  func webSocketDidConnect(_ webSocket: WebSocket) {
//    exit(1)
  }

  func webSocket(_ webSocket: WebSocket, didFailWith error: Error) {
//    exit(2)
  }

  func webSocket(_ webSocket: WebSocket, didReceiveAction type: String, params: [String : Any], messageId: NSNumber) {
//    exit(3)
  }

  func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?) {
    guard let done = self.done else {
//      exit(4)
      fatalError("Done!")
    }

    done()
//    exit(5)
  }
}
