//
//  WebSocket.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

protocol WebSocketDelegate: AnyObject {
  func webSocketDidConnect(_ webSocket: WebSocket)
  func webSocket(_ webSocket: WebSocket, didFailWith error: Error)
  func webSocket(
    _ webSocket: WebSocket,
    didReceiveAction type : String,
    params: [String: Any],
    messageId: NSNumber
  )
  func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?)
}

class WebSocket : NSObject, URLSessionWebSocketDelegate {
  var sessionId: String?
  private var webSocketSessionTask: URLSessionWebSocketTask?
  weak var delegate: WebSocketDelegate?

  func connect(toServer server: URL, withSessionId sessionId: String) {
    wsLog("connecting to server `\(server.absoluteString)` with session-id `\(sessionId)`")

    let urlSession = URLSession(
      configuration: .default,
      delegate: self,
      delegateQueue: OperationQueue.main
    )

    self.sessionId = sessionId

    webSocketSessionTask = urlSession.webSocketTask(with: server)
    webSocketSessionTask?.resume()
  }

  func close() {
    wsLog("closing server connection")
    webSocketSessionTask?.cancel(with: .normalClosure, reason: nil)
    webSocketSessionTask = nil
  }

  func sendAction(_ type: String, params: [String : Any], messageId: NSNumber) {
    wsLog("sending `\(type)` action message (\(messageId.stringValue)), " +
          "with params: `\(params.description)`")

    let jsonData : [String: Any] = [
      "type": type,
      "params": params,
      "messageId": messageId
    ]

    do {
      let data = try JSONSerialization.data(withJSONObject: jsonData, options: [])
      let message = URLSessionWebSocketTask.Message.data(data)

      webSocketSessionTask?.send(message) { error in
        if let error = error {
          wsLog("failed to send message with error: \(error.localizedDescription)", type: .error)
          fatalError("error sending message: \(error.localizedDescription)")
        }

        wsLog("message (`\(type)`) was sent successfully")
      }
    } catch {
      wsLog("failed to encode message with error: \(error.localizedDescription)", type: .error)
      fatalError("error encoding message: \(error.localizedDescription)")
    }
  }

  private func receive() {
    webSocketSessionTask?.receive { [weak self] result in
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

  func urlSession(
    _ session: URLSession,
    webSocketTask: URLSessionWebSocketTask,
    didOpenWithProtocol pr: String?
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
      let params = jsonObject["params"] as? [String: Any]
      let messageId = jsonObject["messageId"] as! NSNumber

      wsLog("action received: \(jsonObject.description)")

      delegate?.webSocket(self, didReceiveAction: type, params: params ?? [:], messageId: messageId)
    } catch {
      wsLog("error decoding action: \(error.localizedDescription)", type: .error)
      fatalError("error decoding receiveAction decode: \(error.localizedDescription)")
    }
  }

  func onDidOpen() {
    wsLog("web-socket did-open")
    sendAction("login", params: ["sessionId": sessionId!, "role": "app"], messageId: 0)
  }
}
