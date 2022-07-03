//
//  WebSocketClient.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

///
class WebSocketClient: NSObject {
  /// Session idenfier of the web-socket session.
  private var sessionId: String?

  /// Web-socket session task.
  private var webSocketSessionTask: URLSessionWebSocketTask?

  /// Called when web-socket state is changes or when receiving messages.
  weak var delegate: WebSocketDelegateProtocol?

  /// Web-socket connect to given `server` with given `sessionId`.
  func connect(toServer server: URL, withSessionId sessionId: String) {
    wsLog("connecting to server `\(server.absoluteString)` with session-id `\(sessionId)`")

    let urlSession = URLSession(
      configuration: .default,
      delegate: self,
      delegateQueue: .init()
    )

    self.sessionId = sessionId

    webSocketSessionTask = urlSession.webSocketTask(with: server)
    webSocketSessionTask?.resume()
  }

  /// Closes the web-socket connection.
  func close() {
    wsLog("closing server connection")
    webSocketSessionTask?.cancel(with: .normalClosure, reason: nil)
    webSocketSessionTask = nil
  }

  /// Sends an action over the web-socket.
  func sendAction(
    _ type: ResponseMessageType,
    params: [String: Any] = [:],
    messageId: NSNumber
  ) {
    wsLog("sending `\(type.rawValue)` action message (\(messageId.stringValue)), " +
          "with params: `\(params.description)`")

    let jsonData: [String: Any] = [
      "type": type.rawValue,
      "params": params,
      "messageId": messageId
    ]

    guard let webSocketSessionTask = webSocketSessionTask else {
      wsLog("web-socket session task is nil, can't send invoke result", type: .error)
      return
    }

    do {
      let data = try JSONSerialization.data(withJSONObject: jsonData, options: [])
      let message = URLSessionWebSocketTask.Message.data(data)

      webSocketSessionTask.send(message) { error in
        if let error = error {
          wsLog("failed to send message with error: \(error.localizedDescription)", type: .error)
          fatalError("error sending message: \(error.localizedDescription)")
        }

        wsLog("message (`\(type.rawValue)`) was sent successfully")
      }
    } catch {
      wsLog("failed to encode message with error: \(error.localizedDescription)", type: .error)
      fatalError("error encoding message: \(error.localizedDescription)")
    }
  }

  private func receive() {
    guard let webSocketSessionTask = webSocketSessionTask else {
      wsLog("web-socket session task is nil, can't receive messages", type: .error)
      fatalError("web-socket session task is nil, can't receive messages")
    }

    webSocketSessionTask.receive { [weak self] result in
      switch result {
        case .failure(let error as NSError):
          wsLog("error receiving message: \(error.localizedDescription)", type: .error)
          fatalError("error receiving message: \(error.localizedDescription)")

        case .success(let message):
          switch message {
            case .string(let string):
              wsLog("successfully received message with string: \(string)")
              self?.receiveAction(json: string)

            case .data(let data):
              let json = String(data: data, encoding: .utf8)!
              wsLog("successfully received message with JSON data: \(json)")
              self?.receiveAction(json: json)

            @unknown default:
              wsLog("could not identify websocket message type, got: \(message)", type: .error)
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
    wsLog("web-socket did open")

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
    wsLog("web-socket did-close with reason: \(reasonString ?? "none")")
    delegate?.webSocket(self, didCloseWith: reasonString)
  }

  func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
    if let error = error {
      wsLog("web-socket did-complete with error: \(error.localizedDescription)", type: .error)
      delegate?.webSocket(self, didFailWith: error)
      return
    }

    wsLog("web-socket did-complete")
    delegate?.webSocket(self, didCloseWith: nil)
  }

  func receiveAction(json: String) {
    do {
      let jsonData = json.data(using: .utf8)!
      let jsonObject = try JSONSerialization.jsonObject(with: jsonData, options: []) as! [String: Any]

      let type = jsonObject["type"] as! String
      let params = jsonObject["params"] as? [String: AnyHashable]
      let messageId = jsonObject["messageId"] as! NSNumber

      wsLog("action received: \(jsonObject.description)")

      delegate?.webSocket(
        self,
        didReceiveMessage: ServerMessageType(rawValue: type)!,
        params: params ?? [:],
        messageId: messageId
      )
    } catch {
      wsLog("error decoding action: \(error.localizedDescription)", type: .error)
      fatalError("error decoding receiveAction decode: \(error.localizedDescription)")
    }
  }

  private func onDidOpen() {
    wsLog("reporting web-socket did-open")

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
