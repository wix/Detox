//
//  WSFacade.swift
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

import Foundation
import UIKit

/// Facade for a WebSocket connection.
public class WSFacade: NSObject {

  private var webSocket: URLSessionWebSocketTask?

  override init() {
    super.init()
    webSocket = .makeTesterWebSocket(delegate: self)
  }

  /// Establishes a WebSocket connection.
  func connect() {
    guard let webSocket = webSocket else {
      fatalError("connection is closed")
    }

    webSocket.resume()
  }

  func isConnected() -> Bool {
    guard let webSocket = webSocket else {
      fatalError("connection is closed")
    }

    var isConnected: Bool = false

    WaitUntilDone { done in
      webSocket.sendPing { error in
        if (error == nil) {
          isConnected = true
        } else {
          print("Ping returned error: \(String(describing: error))")
        }

        done()
      }
    }

    return isConnected
  }

  func send(message: String) {
    guard let webSocket = webSocket else {
      fatalError("connection is closed")
    }

    print("Sending a new message: \(message)")

    WaitUntilDone { done in
      webSocket.send(.string(message)) { error in
        if (error != nil) {
          fatalError("Error occured while sending a WebSocket message: \(String(describing: error))")
        }

        print("Message was successfully sent to WebSocket (\(message))")

        done()
      }
    }
  }

  func receive() {
    guard let webSocket = webSocket else {
      fatalError("connection is closed")
    }

    print("Waiting for a message...")

    WaitUntilDone { done in
      webSocket.receive { result in
        switch result {
          case .success(.string(let message)):
            print("WebSocket message received: \(message)")

          case .failure(let error):
            let errorDescription = String(describing: error)
            fatalError("Error occured while receiving a WebSocket message: \(errorDescription)")

          default:
            fatalError("Unhandled message")
        }

        done()
      }
    }
  }

  func close() {
    guard let webSocket = webSocket else {
      fatalError("connection is already closed")
    }

    webSocket.cancel(with: .goingAway, reason: "Connection close called".data(using: .utf8))

    self.webSocket = nil
  }

}

private extension URLSessionWebSocketTask {
  /// Makes the WebSocket task.
  static func makeTesterWebSocket(delegate: WSFacade) -> URLSessionWebSocketTask {
    let session = URLSession(
      configuration: .default,
      delegate: delegate,
      delegateQueue: OperationQueue()
    )
    return session.webSocketTask(with: .createWebSocketURL())
  }
}

/// Implementation of `URLSessionWebSocketDelegate` protocol methods.
extension WSFacade: URLSessionWebSocketDelegate {
  public func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask,
                         didOpenWithProtocol protocol: String?) {
    print("Connected to WebSocket")
  }

  public func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask,
                         didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
    print("Disconnected from WebSocket")
  }
}
