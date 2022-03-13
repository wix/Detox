//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Used for observing Detox web-socket and handling the received messages from the server.
@objc public class DetoxTester: NSObject, WebSocketDelegateProtocol {
  // MARK: - Properties

  /// The web-socket, used for the communication between Detox Server and Detox Tester.
  private var webSocket: WebSocket?

  /// Finishes the tester operation.
  private var done: (() -> Void)?

  /// Executes a given closure on the main-thread.
  private var exec: ((@escaping () -> Void) -> Void)?

  // MARK: - Start

  /// Starts Detox Tester operation.
  @objc static public func startDetoxTesting() {
    mainLog("starting detox tester")
    shared.start()
  }

  private static var shared : DetoxTester = {
    return .init()
  }()

  /// Make init as private method. Cannot be initialized from outside.
  private override init() {
    super.init()
  }

  private func start() {
    WaitUntilDone { [self] done, exec in
      self.webSocket = makeWebSocket()
      self.done = done
      self.exec = exec
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

    exec! {
      mainLog("[didConnect] Executes on main thread")

      WaitUntilAppIsReady()
      webSocket.sendAction(.reportAppReady, messageId: -1000)

      mainLog("application is ready, reported as ready")
    }
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

    exec! {
      mainLog("[didReceiveAction] Executes action (`\(type)`) on main thread")
    }
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
