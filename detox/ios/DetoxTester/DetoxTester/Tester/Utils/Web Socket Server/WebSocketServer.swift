//
//  WebSocketServer.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import Network

///
protocol WebSocketServerDelegateProtocol {
  ///
  static func responseRecived(data: Data)

  ///
  static func serverDidInit(onPort: UInt16)

  ///
  static func serverIsReady()

  ///
  static func connectionIsReady()
}

/// Manages a web-socket server, assuming there's only one connection.
class WebSocketServer {
  ///
  private let listener: NWListener

  /// Websocket connection. Currently, we assume that there is only one network connection
  /// is available.
  private var client: NWConnection?

  ///
  private var delegate: WebSocketServerDelegateProtocol

  ///
  init(withPort port: UInt16, delegate: WebSocketServerDelegateProtocol) throws {
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
    self.delegate.serverDidInit(onPort: port.rawValue)
  }

  ///
  func startServer() {
    listener.newConnectionHandler = { newConnection in
      wsLog("new connection with tester server")
      self.client = newConnection

      func receive() {
        newConnection.receiveMessage { (data, context, isComplete, error) in
          if let data = data {
            wsLog("received a new message from client")
            self.delegate.responseRecived(data: data)
          }

          receive()
        }
      }

      receive()

      newConnection.stateUpdateHandler = { state in
        switch state {
          case .ready:
            wsLog("connection with client is ready")
            self.delegate.connectionIsReady()

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

    listener.start(queue: serverQueue)
  }

  ///
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
}

extension WebSocketServer {
  /// Error associated with websocket server.
  enum Error: Swift.Error {
    /// Server to establish server due to invalid port.
    case invalidPort
  }
}
