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

  /// Called when disconnected from client.
  func didCloseConnection()

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
      if let previousClient = self.client {
        // TODO: why do we still have a previous client?
        wsLog("server is already connected to the client", type: .error)
        previousClient.cancel()
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
            wsLog("[new connection update] connection with client is ready")
            self.delegate.serverDidConnectClient()

          case .failed(let error):
            wsLog(
              "[new connection update] connection has failed with error: " +
              "\(error.localizedDescription)",
              type: .error
            )

          case .waiting(let error):
            wsLog(
              "[new connection update] connection is waiting for long time " +
              "\(error.localizedDescription)",
              type: .error
            )

          case .setup, .cancelled, .preparing:
            wsLog("[new connection update] connection with client state has changed to `\(state)`")

          @unknown default:
            wsLog("[new connection update] connection with client is unknown")
        }
      }

      let serverQueue = DispatchQueue(label: "ServerQueue")
      newConnection.start(queue: serverQueue)
    }

    listener.stateUpdateHandler = { state in
      switch state {
        case .ready:
          wsLog("[listener state changed] tester server is ready")
          self.delegate.serverIsReady()

        case .failed(let error):
          wsLog(
            "[listener state changed] tester server has failed with error: " +
            "\(error.localizedDescription)",
            type: .error
          )

        case .waiting(let error):
          wsLog(
            "[listener state changed] listener is waiting for long time " +
            "\(error.localizedDescription)",
            type: .error
          )

        case .setup, .cancelled:
          wsLog("[listener state changed] server state has changed to `\(state)`")

        @unknown default:
          wsLog("[listener state changed] server state is unknown")
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

  /// Close active connection.
  func closeClientConnection() {
    guard let previousClient = self.client else {
      wsLog("server called to close connection while not connected to any client", type: .error)
      fatalError("server called to close connection while not connected to any client")
    }

    wsLog("closing client connection", type: .debug)
    previousClient.cancel()
    delegate.didCloseConnection()
    wsLog("client connection did close", type: .debug)
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
    let port: UInt16 = UInt16(self.testTargetServerPort())!

    while true {
      do {
        return try WebSocketServer(withPort: port, delegate: delegate)
      } catch {
        wsLog(
          "failed to create web-socket server: \(error.localizedDescription), " +
          "port is probably taken by another server: \(port)",
          type: .error
        )
        fatalError("Failed to create web-socket server")
      }
    }
  }
}
