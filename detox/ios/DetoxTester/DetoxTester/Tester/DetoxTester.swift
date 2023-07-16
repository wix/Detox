//
//  DetoxTester.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler
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

  /// Executes a given closure synchronically or asynchronically.
  fileprivate var exec: ((Bool, @escaping () -> Void) -> Void)?

  /// Executes the tester operations.
  fileprivate let executor = Executor()

  /// The test-case in which the tester is running from.
  fileprivate(set) var testCase: XCTestCase?

  /// Callbacks for handling a server-received-handler message. Should return true if did handled.
  fileprivate(set) var serverDidReceiveHandlers: [((Data) -> Bool)] = []

  /// Semaphore for waiting the white-box handler to finish its executions.
  static private let whiteBoxClientConnectionSemaphore: DispatchSemaphore = .init(value: 0)

  // MARK: - Start

  /// Starts Detox Tester operation.
  @objc static func startDetoxTesting(from testCase: XCTestCase) {
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

      // TODO: make sure there's an error message when the app crashes.
      DetoxTester.whiteBoxClientConnectionSemaphore.wait()

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

    exec! (true) {
      mainLog("[didConnect] Executes on main thread")

      waitUntilAppIsReady(.selectedApp)
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

    // Closes client connection if tester disconnected.
    if type == .disconnect {
      webSocket.close()
    }

    exec! (type.isBackgroundTask) { [self] in
      mainLog(
        "`didReceiveAction` was called, executes action `\(type.rawValue)`" +
        "\(type.isBackgroundTask ? " on the background" : "")"
      )
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
    guard let webSocketClient = webSocketClient else {
      mainLog("web-socket is `nil`, cannot send action", type: .error)
      fatalError("Failed sending action through web-socket")
    }

    mainLog("executor-delegate send action: `\(type)`")
    webSocketClient.sendAction(type, params: params, messageId: messageId)
  }

  func cleanup() {
    guard let webSocketServer = webSocketServer else {
      mainLog("web-socket is `nil`, cannot cleanup test target", type: .error)
      fatalError("Failed clean-up web-socket")
    }

    mainLog("cleanup(): closing web-socket server connection with app client")
    webSocketServer.closeClientConnection()
  }

  func disconnect() {
    guard let webSocket = webSocketClient else {
      mainLog("web-socket is `nil`, cannot disconnect test target", type: .error)
      fatalError("Failed closing web-socket")
    }

    mainLog("disconnect(): closing web-socket client connection to the JS tester")
    webSocket.close()
  }

  func terminate() {
    guard let done = self.done else {
      mainLog("unexpected call to done", type: .error)
      fatalError("unexpected call to done, Detox is already done")
    }

    done()
  }
}

// MARK: - WebSocketServerDelegateProtocol

extension DetoxTester: WebSocketServerDelegateProtocol {
  func serverDidReceive(data: Data) {
    mainLog("`serverDidReceive` called")

    // `AppWillTerminateWithError` is a special message type, because it send on failure and not by
    //  demand. This is a quick & dirty workaround to make crash-handling work.
    // TODO: pass the decoded data to the handlers (`decoded`).
    // TODO: Refactor (extract).

    var decoded: [String: AnyCodable]!
    do {
      decoded = try JSONDecoder().decode([String: AnyCodable].self, from: data)
    }
    catch {
      mainLog("response for decoding `data` is invalid, can't be decoded!", type: .error)
      fatalError("failed to decode `data`")
    }

    mainLog("`serverDidReceive` decoded response: \(decoded.debugDescription)")
    if (decoded["type"]?.value as! String == "AppWillTerminateWithError") {
      mainLog("reporting `AppWillTerminateWithError`")
      let params = decoded["params"]?.value as! [String : Any]

      sendAction(
        .reportWillTerminateWithError,
        params: params,
        messageId: NSNumber(value: decoded["messageId"]?.value as! Int)
      )

      Thread.sleep(forTimeInterval: 5)

      mainLog("running clean-up and raising fatal-error message", type: .debug)
      cleanup()
      fatalError("Crash occurred, error details: \(params)")
    }

    mainLog("`serverDidReceive` executing on handlers")
    let handlers = serverDidReceiveHandlers

    for (index, handler) in handlers.enumerated() {
      let didHandle = handler(data)
      if didHandle == true {
        mainLog("did handled by handler #\(index)", type: .debug)
        serverDidReceiveHandlers.remove(at: index)
        break
      }

      mainLog("did not handled by handler #\(index)", type: .debug)
    }
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

    mainLog("setting timeout operation (will be cancelled on successful connection)", type: .debug)
    DispatchQueue.main.asyncAfter(deadline: .now() + 10) {
      guard WhiteBoxExecutor.getHandler(for: .selectedApp) != nil else {
        mainLog("DID TIMEOUT", type: .error)
        fatalError("Did not connected white-box app after 10 seconds..")
      }

      mainLog("timeout operation was cancelled", type: .debug)
    }
  }

  func didCloseConnection() {
    mainLog("tester server did close connection to the app client")
    WhiteBoxExecutor.removeHandler(with: .selectedApp)
  }

  func serverDidConnectClient() {
    mainLog("tester server did connect to the app client")

    // We assume that the app is connected in a white-box manner.
    WhiteBoxExecutor.setNewHandler(
      for: .selectedApp,
      withMessageSender: self
    )

    DetoxTester.whiteBoxClientConnectionSemaphore.signal()
  }
}

// MARK: - AppClientMessageSenderProtocol

extension DetoxTester: AppClientMessageSenderProtocol {
  func sendMessageToClient(_ data: Data, messageId: Int) -> Data {
    guard let server = webSocketServer else {
      mainLog("web-socket server has not initialized yet", type: .error)
      fatalError("web-socket server has not initialized yet")
    }

    do {
      mainLog("tester is sending message to app client (white-box), message: #\(messageId)")
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

    serverDidReceiveHandlers.append({ data in
      mainLog(
        "`serverDidReceiveHandler` got response, checking if relevant for handler",
        type: .debug
      )

      var decoded: [String: AnyCodable]!
      do {
        decoded = try JSONDecoder().decode([String: AnyCodable].self, from: data)
      }
      catch {
        mainLog(
          "response for decoding `data` is invalid, can't be decoded!", type: .error
        )
        fatalError("failed to decode `data`")
      }

      let actualMessageId = decoded["messageId"]?.value as? Int ?? -1

      if (messageId != actualMessageId) {
        mainLog(
          "message Id #\(actualMessageId) does not match the message Id #\(messageId)",
          type: .debug
        )
        return false
      }

      mainLog("return result from message #\(actualMessageId)", type: .debug)
      serverResponse = data
      semaphore.signal()
      return true
    })

    // Wait until response is received via `serverDidReceiveHandler`.
    mainLog(
      "waiting for response (`serverDidReceiveHandler`), for message-id #\(messageId). " +
      "Running on thread: \(Thread.current.debugDescription)",
      type: .debug
    )

    semaphore.wait()

    guard let serverResponse = serverResponse else {
      mainLog("server has responded but return value is nil", type: .error)
      fatalError("server has responded but return value is nil")
    }

    return serverResponse
  }
}
