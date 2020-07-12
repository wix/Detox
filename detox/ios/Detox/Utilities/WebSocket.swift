//
//  WebSocket.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/22/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import Foundation
import SocketRocket

fileprivate let log = DetoxLog(category: "WebSocket")

protocol WebSocketDelegate: class {
	func webSocketDidConnect(_ webSocket: WebSocket)
	func webSocket(_ webSocket: WebSocket, didFailWith error: Error)
	func webSocket(_ webSocket: WebSocket, didReceiveAction type : String, params: [String: Any], messageId: NSNumber)
	func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?)
}

protocol WebSocket : class {
	var sessionId : String? { get }
	var delegate : WebSocketDelegate? { get set }
	
	func connect(toServer server: URL, withSessionId sessionId: String)
	func close()
	func sendAction(_ type: String, params: [String: Any], messageId: NSNumber)
}

fileprivate extension WebSocket {
	func receiveAction(json: String) {
		do {
			let jsonData = json.data(using: .utf8)!
			let obj = try JSONSerialization.jsonObject(with: jsonData, options: []) as! [String: Any]
			
			let type = obj["type"] as! String
			let params = obj["params"] as? [String: Any]
			let messageId = obj["messageId"] as! NSNumber
			
			log.info("Action received: \(type)")
			
			delegate?.webSocket(self, didReceiveAction: type, params: params ?? [:], messageId: messageId)
		} catch {
			log.error("Error decoding receiveAction decode: \(error.localizedDescription)")
		}
	}
	
	func onDidOpen() {
		sendAction("login", params: ["sessionId": sessionId!, "role": "testee"], messageId: 0)
	}
}

@available(iOS 13.0, *)
class WebSocketImpl : NSObject, WebSocket, URLSessionWebSocketDelegate {
	var sessionId: String?
	private var urlSession: URLSession!
	private var webSocketSessionTask: URLSessionWebSocketTask!
	weak var delegate: WebSocketDelegate?
	
	override init() {
		super.init()
		urlSession = URLSession(configuration: .default, delegate: self, delegateQueue: OperationQueue.main)
	}
	
	func connect(toServer server: URL, withSessionId sessionId: String) {
		self.sessionId = sessionId
		
		webSocketSessionTask = urlSession.webSocketTask(with: server)
		webSocketSessionTask.resume()
	}
	
	func close() {
		webSocketSessionTask.cancel(with: .normalClosure, reason: nil)
		webSocketSessionTask = nil
	}
	
	func sendAction(_ type: String, params: [String : Any], messageId: NSNumber) {
		let data : [String: Any] = ["type": type, "params": params, "messageId": messageId]
		do {
			let data = try JSONSerialization.data(withJSONObject: data, options: [])
			let message = URLSessionWebSocketTask.Message.data(data)
			webSocketSessionTask.send(message) { error in
				if let error = error {
					log.error("Error sending message: \(error.localizedDescription)")
				}
			}
		} catch {
			log.error("Error encoding message: \(error.localizedDescription)")
		}
	}
	
	private func receive() {
		webSocketSessionTask.receive { [weak self] result in
			switch result {
			case .failure(let error as NSError):
				log.error("Error receiving message: \(error.localizedDescription)")
			case .success(let message):
				switch message {
				case .string(let string):
					self?.receiveAction(json: string)
				case .data(let data):
					self?.receiveAction(json: String(data: data, encoding: .utf8)!)
				@unknown default:
					fatalError("Unknown websocket message type")
				}
				
				self?.receive()
			}
		}
	}
	
	func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didOpenWithProtocol pr: String?) {
		onDidOpen()
		receive()
		
		delegate?.webSocketDidConnect(self)
	}
	
	
	func urlSession(_ session: URLSession, webSocketTask: URLSessionWebSocketTask, didCloseWith closeCode: URLSessionWebSocketTask.CloseCode, reason: Data?) {
		let string: String?
		if let reason = reason, let str = String(data: reason, encoding: .utf8) {
			string = str
		} else {
			string = nil
		}
		
		delegate?.webSocket(self, didCloseWith: string)
	}
	
	func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
		if let error = error {
			delegate?.webSocket(self, didFailWith: error)
		} else {
			delegate?.webSocket(self, didCloseWith: nil)
		}
	}
}

@available(iOS, deprecated: 13.0, message: "Use WebSocketImpl instead.")
class WebSocketLegacyImpl : NSObject, WebSocket, SRWebSocketDelegate {
	weak var delegate : WebSocketDelegate?
	var sessionId : String?
	private var webSocket : SRWebSocket?
	
	func connect(toServer server: URL, withSessionId sessionId: String) {
		if webSocket != nil {
			webSocket?.close()
			webSocket = nil
		}
		self.sessionId = sessionId
		webSocket = SRWebSocket(url: server)
		webSocket!.delegate = self
		webSocket!.open()
	}
	
	func close() {
		self.webSocket?.close()
		self.webSocket = nil
	}
	
	func sendAction(_ type: String, params: [String: Any], messageId: NSNumber) {
		let data : [String: Any] = ["type": type, "params": params, "messageId": messageId]
		do {
			let data = try JSONSerialization.data(withJSONObject: data, options: [])
			let json = String(data: data, encoding: .utf8)!
			try? webSocket?.send(string: json)
			
		} catch {
			log.error("Error decoding sendAction encode: \(error.localizedDescription)")
		}
	}
	
	public func webSocketDidOpen(_ webSocket: SRWebSocket) {
		delegate?.webSocketDidConnect(self)
		onDidOpen()
	}
	
	public func webSocket(_ webSocket: SRWebSocket, didReceiveMessageWith string: String) {
		receiveAction(json: string)
	}
	
	public func webSocket(_ webSocket: SRWebSocket, didFailWithError error: Error) {
		delegate?.webSocket(self, didFailWith: error)
	}
	
	public func webSocket(_ webSocket: SRWebSocket, didCloseWithCode code: Int, reason: String?, wasClean: Bool) {
		delegate?.webSocket(self, didCloseWith: reason)
	}
}
