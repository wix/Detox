//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Used for observing Detox web-socket and handling the received messages from the server.
@objc class DetoxTester: NSObject {
  // MARK: - Properties

  /// The web-socket, used for the communication between Detox Server and Detox Tester.
  fileprivate var webSocket: WebSocketClient?

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
  @objc static func startDetoxTesting(from testCase: XCTestCase) {
    mainLog("starting detox tester")
    shared.start(from: testCase)
  }

  fileprivate(set) static var shared : DetoxTester = {
    return .init()
  }()

  /// Make init as private method. Cannot be initialized from outside.
  private override init() {
    super.init()
    executor.setServerMessageSender(self)
  }

  private func start(from testCase: XCTestCase) {
    self.testCase = testCase

    WaitUntilDone { [self] done, exec in
      self.exec = exec
      self.done = done
      self.webSocket = makeWebSocket()
    }
  }

  private func makeWebSocket() -> WebSocketClient {
    let webSocket: WebSocketClient = WebSocketClient()
    webSocket.delegate = self

    webSocket.connect(
      toServer: URL(string: WebSocketClient.detoxServer())!,
      withSessionId: WebSocketClient.detoxSessionId()
    )

    mainLog("web-socket connection started")

    return webSocket
  }
}

// MARK: - WebSocketDelegateProtocol

extension DetoxTester: WebSocketDelegateProtocol {
  func webSocketDidConnect(_ webSocket: WebSocketClient) {
    mainLog("web-socket did-connect")

    exec! {
      mainLog("[didConnect] Executes on main thread")

      WaitUntilAppIsReady()
      webSocket.sendAction(.reportReady, messageId: -1000)

      mainLog("application is ready, reported as ready")
    }
  }

  func webSocket(_ webSocket: WebSocketClient, didFailWith error: Error) {
    mainLog("web-socket failed with error: \(error.localizedDescription)", type: .error)
    fatalError("web-socket did fail with error: \(error.localizedDescription)")
  }

  func webSocket(
    _ webSocket: WebSocketClient,
    didReceiveMessage type: ServerMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    mainLog("web-socket received `\(type.rawValue)` message (#\(messageId.stringValue)), " +
            "with params: \(params.description)")

    exec! { [self] in
      mainLog("`didReceiveAction` was called, executes action: `\(type.rawValue)`")
      executor.execute(type, params: params, messageId: messageId)
    }
  }

  func webSocket(_ webSocket: WebSocketClient, didCloseWith reason: String?) {
    guard let done = self.done else {
      mainLog("unexpected call to close web-socket connection", type: .error)
      fatalError("unexpected call to close web-socket connection, Detox is already done")
    }

    mainLog("web-socket connection did close")
    done()
  }
}

// MARK: - ServerMessageSenderProtocol

extension DetoxTester: ServerMessageSenderProtocol {
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: AnyHashable],
    messageId: NSNumber
  ) {
    guard let webSocket = webSocket else {
      mainLog("web-socket is `nil`, cannot send action", type: .error)
      fatalError("Failed sending action through web-socket")
    }

    mainLog("executor-delegate send action: `\(type)`")
    webSocket.sendAction(type, params: params, messageId: messageId)
  }

  func cleanup() {
    guard let webSocket = webSocket else {
      mainLog("web-socket is `nil`, cannot cleanup test target", type: .error)
      fatalError("Failed closing web-socket")
    }

    mainLog("cleanup: closing web-socket connection")
    webSocket.close()
  }
}
