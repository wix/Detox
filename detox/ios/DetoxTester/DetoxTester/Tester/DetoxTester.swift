//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Used for observing Detox web-socket and handling the received messages from the server.
@objc class DetoxTester: NSObject {
  // MARK: - Properties

  /// Web-socket client, used for the communication between Detox Server and Detox Tester (this
  /// target).
  fileprivate var webSocketClient: WebSocketClient?

  /// Web-socket server, used for the communication between Detox Tester (this target) and the AUT
  /// (application under test).
  fileprivate var webSocketServer: WebSocketServer?

  /// Finishes the tester operation.
  fileprivate var done: (() -> Void)?

  /// Executes a given closure on the main-thread.
  fileprivate var exec: ((@escaping () -> Void) -> Void)?

  /// Executes the tester operations.
  fileprivate let executor = Executor()

  /// The test-case in which the tester is running from.
  fileprivate(set) var testCase: XCTestCase?

  /// Callback for handling a server-received-handler message.
  fileprivate(set) var serverDidReceiveHandler: ((Data) -> Void)?

  /// Semaphore for waiting the white-box handler to finish its executions.
  static private let whiteBoxClientConnectionSemaphore: DispatchSemaphore = .init(value: 0)

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

      mainLog("starting web-socket server (for white-box connections)...")
      self.webSocketServer = makeWebSocketServer()
      DetoxTester.whiteBoxClientConnectionSemaphore.wait()

      mainLog("starting to pings app periodically")
      self.webSocketServer?.pingPeriodically()

      mainLog("connecting with server (main connection)...")
      self.webSocketClient = makeWebSocketClient()
    }
  }

  private func makeWebSocketClient() -> WebSocketClient {
    let client = WebSocketClient()
    client.delegate = self

    client.connect(
      toServer: URL(string: WebSocketClient.detoxServer())!,
      withSessionId: WebSocketClient.detoxSessionId()
    )

    mainLog("web-socket connection with Detox Server started")
    return client
  }

  private func makeWebSocketServer() -> WebSocketServer {
    let server = WebSocketServer.makeServer(withDelegate: self)
    server.startServer()

    mainLog("web-socket server (tester target) has started")
    return server
  }
}

// MARK: - WebSocketClientDelegateProtocol

extension DetoxTester: WebSocketClientDelegateProtocol {
  func webSocketDidConnect(_ webSocket: WebSocketClient) {
    mainLog("web-socket did-connect")

    exec! { [self] in
      mainLog("[didConnect] Executes on main thread")

      waitUntilAppIsReady(executor.getAppUnderTest())
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

// MARK: - DetoxServerMessageSenderProtocol

extension DetoxTester: DetoxServerMessageSenderProtocol {
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: Any],
    messageId: NSNumber
  ) {
    guard let webSocket = webSocketClient else {
      mainLog("web-socket is `nil`, cannot send action", type: .error)
      fatalError("Failed sending action through web-socket")
    }

    mainLog("executor-delegate send action: `\(type)`")
    webSocket.sendAction(type, params: params, messageId: messageId)
  }

  func cleanup() {
    guard let webSocket = webSocketServer else {
      mainLog("web-socket is `nil`, cannot cleanup test target", type: .error)
      fatalError("Failed clean-up web-socket")
    }

    mainLog("cleanup(): closing web-socket server connection with app client")
    webSocket.closeClientConnection()

    mainLog("cleanup(): waiting for next connection to be established")
    DetoxTester.whiteBoxClientConnectionSemaphore.wait()
  }

  func disconnect() {
    guard let webSocket = webSocketClient else {
      mainLog("web-socket is `nil`, cannot disconnect test target", type: .error)
      fatalError("Failed closing web-socket")
    }

    mainLog("disconnect(): closing web-socket client connection to the JS tester")
    webSocket.close()
  }
}

// MARK: - WebSocketServerDelegateProtocol

extension DetoxTester: WebSocketServerDelegateProtocol {
  func serverDidReceive(data: Data) {
    guard let handler = serverDidReceiveHandler else {
      mainLog("there is no handler for handling messages from client", type: .error)
      return
    }

    handler(data)
  }

  func serverDidInit(onPort port: UInt16) {
    mainLog("tester server did initialized on port \(port)")
  }

  func serverIsReady() {
    guard let server = webSocketServer else {
      mainLog("web-socket server has not initialized yet", type: .error)
      fatalError("web-socket server has not initialized yet")
    }

    mainLog("tester server is ready on port \(server.port)")
  }

  func didCloseConnection() {
    mainLog("tester server did close connection to the app client")
    WhiteBoxExecutor.removeHandler(with: executor.getAppUnderTestBundleIdentifier())
  }

  func serverDidConnectClient() {
    mainLog("tester server did connect to the app client")

    // There is an assumption that the app is connected in a white-box manner.
    WhiteBoxExecutor.setNewHandler(
      for: executor.getAppUnderTestBundleIdentifier(),
      withMessageSender: self
    )

    DetoxTester.whiteBoxClientConnectionSemaphore.signal()
  }
}

// MARK: - AppClientMessageSenderProtocol

extension DetoxTester: AppClientMessageSenderProtocol {
  func sendMessageToClient(_ data: Data) -> Data {
    guard let server = webSocketServer else {
      mainLog("web-socket server has not initialized yet", type: .error)
      fatalError("web-socket server has not initialized yet")
    }

    do {
      try server.sendMessage(data: data)
    } catch {
      mainLog(
        "sending a message to the client has failed, error: \(error.localizedDescription)",
        type: .error
      )
      fatalError("sending a message to the client has failed, error: \(error.localizedDescription)")
    }

    let semaphore = DispatchSemaphore(value: 0)
    var serverResponse: Data?
    serverDidReceiveHandler = { data in
      serverResponse = data
      semaphore.signal()
    }

    // Wait until response is received via `serverDidReceiveHandler`.
    semaphore.wait()

    guard let serverResponse = serverResponse else {
      mainLog("server has responsed but return value is nil", type: .error)
      fatalError("server has responsed but return value is nil")
    }
    return serverResponse
  }
}
