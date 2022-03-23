//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Used for observing Detox web-socket and handling the received messages from the server.
@objc public class DetoxTester: NSObject {
  // MARK: - Properties

  /// The web-socket, used for the communication between Detox Server and Detox Tester.
  fileprivate var webSocket: WebSocket?

  /// Finishes the tester operation.
  fileprivate var done: (() -> Void)?

  /// Executes a given closure on the main-thread.
  fileprivate var exec: ((@escaping () -> Void) -> Void)?

  /// Executes the tester operations.
  fileprivate let executor = Executor()

  /// The test-case in which the tester is running from.
  fileprivate(set) var testCase: XCTestCase?

  // MARK: - Start

  /// Starts Detox Tester operation.
  @objc static public func startDetoxTesting(from testCase: XCTestCase) {
    mainLog("starting detox tester")
    shared.start(from: testCase)
  }

  fileprivate(set) static var shared : DetoxTester = {
    return .init()
  }()

  /// Make init as private method. Cannot be initialized from outside.
  private override init() {
    super.init()
    executor.delegate = self
  }

  private func start(from testCase: XCTestCase) {
    self.testCase = testCase

    WaitUntilDone { [self] done, exec in
      self.exec = exec
      self.done = done
      self.webSocket = makeWebSocket()
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
}

// MARK: - WebSocketDelegateProtocol

extension DetoxTester: WebSocketDelegateProtocol {
  func webSocketDidConnect(_ webSocket: WebSocket) {
    mainLog("web-socket did-connect")

    exec! {
      mainLog("[didConnect] Executes on main thread")

      WaitUntilAppIsReady()
      webSocket.sendAction(.reportReady, messageId: -1000)

      mainLog("application is ready, reported as ready")
    }
  }

  func webSocket(_ webSocket: WebSocket, didFailWith error: Error) {
    mainLog("web-socket failed with error: \(error.localizedDescription)", type: .error)
    fatalError("web-socket did fail with error: \(error.localizedDescription)")
  }

  func webSocket(
    _ webSocket: WebSocket,
    didReceiveAction type: WebSocketReceiveActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    mainLog("web-socket received `\(type.rawValue)` message (#\(messageId.stringValue)), " +
            "with params: \(params.description)")

    exec! { [self] in
      mainLog("[didReceiveAction] Executes action (`\(type.rawValue)`) on main thread")
      executor.execute(type, params: params, messageId: messageId)
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

// MARK: - ExecutorDelegateProtocol

extension DetoxTester: ExecutorDelegateProtocol {
  public func sendAction(
    _ type: WebSocketSendActionType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    mainLog("executor-delegate send action: `\(type)`")
    webSocket?.sendAction(type, params: params, messageId: messageId)
  }
}
