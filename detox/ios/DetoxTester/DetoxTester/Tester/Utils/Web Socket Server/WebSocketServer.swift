//
//  WebSocketServer.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import Network

/// A web-socket server that listens for incoming messages from Detox Server.
protocol WebSocketServerDelegateProtocol {
  /// Called when a message is received from Detox Server.
  func serverDidReceive(data: Data)

  /// Called when the web-socket server is initialized.
  func serverDidInit(onPort: UInt16)

  /// Called when the web-socket server is ready to receive messages.
  func serverIsReady()

  /// Called when the web-socket server is connected to client.
  func serverDidConnectClient()
}

/// Manages a web-socket server, assuming there's only one connection.
class WebSocketServer {
  /// The underlying web-socket listener.
  private let listener: NWListener

  /// The client connection.
  private var client: NWConnection?

  /// Delegate to notify when the server state changes or a message is received.
  private var delegate: WebSocketServerDelegateProtocol

  /// The port the server is listening on.
  public let port: UInt16


  ///
  private let connectionQueue: DispatchQueue = .main

  ///
  private var pingTimer: Timer?

  /// Creates a new web-socket server.
  private init(withPort port: UInt16, delegate: WebSocketServerDelegateProtocol) throws {
    self.port = port
    self.delegate = delegate

    let parameters = NWParameters(tls: nil)
    parameters.allowLocalEndpointReuse = true
    parameters.includePeerToPeer = true

    let wsOptions = NWProtocolWebSocket.Options()
    wsOptions.autoReplyPing = true

    parameters.defaultProtocolStack.applicationProtocols.insert(wsOptions, at: 0)

    guard let port = NWEndpoint.Port(rawValue: port) else {
      wsLog("unable to establish web-socket server on port \(port)", type: .error)
      throw Error.invalidPort
    }

    listener = try NWListener(using: parameters, on: port)

    wsLog("web-socket server established on port \(port)")
    delegate.serverDidInit(onPort: port.rawValue)
  }

  /// Starts listening for incoming connections.
  func startServer() {
    listener.newConnectionHandler = { newConnection in
      guard self.client == nil else {
        wsLog("server is already connected to a client", type: .error)
        fatalError("server is already connected to a client")
      }

      wsLog("new connection with tester server")
      self.client = newConnection

      func receive() {
        newConnection.receiveMessage { (data, context, isComplete, error) in
          if let data = data {
            wsLog("received a new message from client")
            self.delegate.serverDidReceive(data: data)
          }

          receive()
        }
      }

      receive()

      newConnection.stateUpdateHandler = { state in
        switch state {
          case .ready:
            wsLog("connection with client is ready")
            self.delegate.serverDidConnectClient()

          case .failed(let error):
            wsLog("connection has failed with error: \(error.localizedDescription)", type: .error)
            fatalError("connection has failed with error: \(error.localizedDescription)")

          case .waiting(let error):
            wsLog("connection is waiting for long time \(error.localizedDescription)", type: .error)

          case .setup, .cancelled, .preparing:
            wsLog("connection with client state has changed to `\(state)`")

          @unknown default:
            wsLog("connection with client is unknown")
        }
      }

      let serverQueue = DispatchQueue(label: "ServerQueue")
      newConnection.start(queue: serverQueue)
    }

    listener.stateUpdateHandler = { state in
      switch state {
        case .ready:
          wsLog("tester server is ready")
          self.delegate.serverIsReady()

        case .failed(let error):
          wsLog("tester server has failed with error: \(error.localizedDescription)", type: .error)
          fatalError("server has failed with error: \(error.localizedDescription)")

        case .waiting(let error):
          wsLog("listener is waiting for long time \(error.localizedDescription)", type: .error)

        case .setup, .cancelled:
          wsLog("server state has changed to `\(state)`")

        @unknown default:
          wsLog("server state is unknown")
      }
    }

    listener.start(queue: .init(label: "XCUITestServerQueue"))
  }

  /// Sends a message to the client.
  func sendMessage(data: Data) throws {
    guard let client = client else {
      wsLog("no client is available, can't send message", type: .error)
      fatalError("No client is available, can't send message")
    }

    try sendMessage(toClient: client, data: data)
  }

  private func sendMessage(toClient client: NWConnection, data: Data) throws {
    let metadata = NWProtocolWebSocket.Metadata(opcode: .binary)
    let context = NWConnection.ContentContext(identifier: "context", metadata: [metadata])

    client.send(
      content: data,
      contentContext: context,
      isComplete: true,
      completion: .contentProcessed({ error in
        if let error = error {
          wsLog("client error when sending message: \(error.localizedDescription)", type: .error)
        }
      })
    )
  }

  /// Ping the WebSocket periodically.
  func pingPeriodically() {
    guard let client = client else {
      wsLog("no client is available, can't send message", type: .error)
      fatalError("No client is available, can't send message")
    }

    ping(interval: 5, toClient: client)
  }

  private func ping(interval: TimeInterval, toClient client: NWConnection) {
    pingTimer = .scheduledTimer(withTimeInterval: interval, repeats: true) { [weak self] _ in
      guard let self = self else {
        return
      }

      self.ping(toClient: client)
    }
    pingTimer?.tolerance = 0.01
  }

  /// Ping the WebSocket once.
  private func ping(toClient client: NWConnection) {
    wsLog("sending ping to client")
    let metadata = NWProtocolWebSocket.Metadata(opcode: .ping)

    metadata.setPongHandler(connectionQueue) { error in
      if let error = error {
        wsLog("error receiving pong from client: \(error)", type: .error)
      } else {
        wsLog("received pong from client")
      }
    }

    let context = NWConnection.ContentContext(identifier: "pingContext", metadata: [metadata])

    client.send(
      content: "ping".data(using: .utf8),
      contentContext: context,
      completion: .contentProcessed({ error in
        if let error = error {
          wsLog("client error when sending ping: \(error.localizedDescription)", type: .error)
        }
      })
    )
  }
}

extension WebSocketServer {
  /// Error associated with websocket server.
  enum Error: Swift.Error {
    /// Failed to establish server due to invalid port.
    case invalidPort
  }
}

extension WebSocketServer.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .invalidPort:
        return "Failed to establish server due to invalid port"
    }
  }
}

extension WebSocketServer {
  /// Creates a new web-socket server.
  static func makeServer(
    withDelegate delegate: WebSocketServerDelegateProtocol
  ) -> WebSocketServer {
    let port: UInt16 = 8797

    while true {
      do {
        return try WebSocketServer(withPort: port, delegate: delegate)
        // TODO: consider trying different ports if fails..
        // i.e: `catch is WebSocketServer.Error { port += 1 ... }`
      } catch {
        wsLog(
          "failed to create web-socket server: \(error.localizedDescription), port: \(port)",
          type: .error
        )
        fatalError("Failed to create web-socket server")
      }
    }
  }
}
