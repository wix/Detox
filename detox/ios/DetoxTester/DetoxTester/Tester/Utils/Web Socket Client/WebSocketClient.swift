//
//  WebSocketClient.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// A web socket client.
class WebSocketClient: NSObject {
  /// Session identifier of the web-socket session.
  private var sessionId: String?

  /// Web-socket session task.
  private var webSocketSessionTask: URLSessionWebSocketTask?

  /// Called when web-socket state is changes or when receiving messages.
  weak var delegate: WebSocketClientDelegateProtocol?

  /// Web-socket connect to given `server` with given `sessionId`.
  func connect(toServer server: URL, withSessionId sessionId: String) {
    wsClientLog("connecting to server `\(server.absoluteString)` with session-id `\(sessionId)`")

    let urlSession = URLSession(
      configuration: .default,
      delegate: self,
      delegateQueue: .init()
    )

    self.sessionId = sessionId

    webSocketSessionTask = urlSession.webSocketTask(with: server)
    webSocketSessionTask?.resume()
  }

  /// Closes the web-socket client connection.
  func close() {
    wsClientLog("closing client connection")
    webSocketSessionTask?.cancel(with: .normalClosure, reason: nil)
    webSocketSessionTask = nil
  }

  /// Sends an action over the web-socket.
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: Any] = [:],
    messageId: NSNumber
  ) {
    wsClientLog("sending `\(type.rawValue)` action message (\(messageId.stringValue)), " +
          "with params: `\(params.description)`")

    let json: [String: Any] = [
      "type": type.rawValue,
      "params": params,
      "messageId": messageId
    ]

    guard let webSocketSessionTask = webSocketSessionTask else {
      wsClientLog("web-socket session task is nil, can't send messages to client", type: .info)
      return
    }

    do {
      wsClientLog("JSON-serializing message: \(json)", type: .debug)

      let data = try JSONSerialization.data(withJSONObject: json, options: [])
      wsClientLog(
        "message was JSON-serialized, sending: `\(String(data: data, encoding: .utf8)!)`",
        type: .debug
      )

      let message = URLSessionWebSocketTask.Message.data(data)

      webSocketSessionTask.send(message) { error in
        if let error = error {
          wsClientLog("failed to send message with error: \(error.localizedDescription)", type: .error)
          fatalError("error sending message: \(error.localizedDescription)")
        }

        wsClientLog("message (`\(type.rawValue)`) was sent successfully")
      }
    } catch {
      wsClientLog("failed to encode message with error: \(error.localizedDescription)", type: .error)
      fatalError("error encoding message: \(error.localizedDescription)")
    }
  }

  private func receive() {
    guard let webSocketSessionTask = webSocketSessionTask else {
      wsClientLog("web-socket session task is nil, can't receive messages", type: .info)
      return
    }

    webSocketSessionTask.receive { [weak self] result in
      switch result {
        case .failure(let error as NSError):
          wsClientLog("error receiving message: \(error.localizedDescription)", type: .error)
          fatalError("error receiving message: \(error.localizedDescription)")

        case .success(let message):
          switch message {
            case .string(let string):
              wsClientLog("successfully received message with string: \(string)")
              self?.receiveAction(json: string)

            case .data(let data):
              let json = String(data: data, encoding: .utf8)!
              wsClientLog("successfully received message with JSON data: \(json)")
              self?.receiveAction(json: json)

            @unknown default:
              wsClientLog("could not identify websocket message type, got: \(message)", type: .error)
              fatalError("unknown websocket message type")
          }

          self?.receive()
      }
    }
  }
}

  // MARK: - URLSessionWebSocketDelegate

extension WebSocketClient: URLSessionWebSocketDelegate {
  func urlSession(
    _ session: URLSession,
    webSocketTask: URLSessionWebSocketTask,
    didOpenWithProtocol protocolName: String?
  ) {
    wsClientLog("web-socket did open")

    onDidOpen()
    receive()

    delegate?.webSocketDidConnect(self)
  }

  func urlSession(
    _ session: URLSession,
    webSocketTask: URLSessionWebSocketTask,
    didCloseWith closeCode: URLSessionWebSocketTask.CloseCode,
    reason: Data?
  ) {
    let reasonString = reason != nil ? String(data: reason!, encoding: .utf8) : nil

    wsClientLog("web-socket did-close with reason: \(reasonString ?? "none")")
    delegate?.webSocket(self, didCloseWith: reasonString)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      wsClientLog("web-socket did-complete with error: \(error.localizedDescription)", type: .error)
      delegate?.webSocket(self, didFailWith: error)
      return
    }

    wsClientLog("web-socket did-complete")
  }

  func receiveAction(json: String) {
    do {
      let jsonData = json.data(using: .utf8)!
      let jsonObject = try JSONSerialization.jsonObject(with: jsonData, options: []) as! [String: Any]

      let type = jsonObject["type"] as! String
      let params = jsonObject["params"] as? [String: AnyHashable]
      let messageId = jsonObject["messageId"] as! NSNumber

      wsClientLog("action received: \(jsonObject.description)")

      delegate?.webSocket(
        self,
        didReceiveMessage: ServerMessageType(rawValue: type)!,
        params: params ?? [:],
        messageId: messageId
      )
    } catch {
      wsClientLog("error decoding action: \(error.localizedDescription)", type: .error)
      fatalError("error decoding receiveAction decode: \(error.localizedDescription)")
    }
  }

  private func onDidOpen() {
    wsClientLog("reporting web-socket did-open")

    sendAction(
      .reportWebSocketDidOpen,
      params: [
        "sessionId": sessionId!,
        "role": "app"
      ],
      messageId: 0
    )
  }
}
