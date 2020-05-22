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

protocol WebSocketDelegate : NSObjectProtocol {
	func webSocketDidConnect(_ webSocket: WebSocket)
	func webSocket(_ webSocket: WebSocket, didFailWith error: Error)
	func webSocket(_ webSocket: WebSocket, didReceiveAction type : String, params: [String: Any], messageId: NSNumber)
	func webSocket(_ webSocket: WebSocket, didCloseWith reason: String?)
}

class WebSocket : NSObject, SRWebSocketDelegate {
	weak var delegate : WebSocketDelegate?
	private var sessionId : String!
	private var webSocket : SRWebSocket!
	
	func connect(toServer server: URL, withSessionId sessionId: String) {
		if webSocket != nil {
			webSocket.close()
			webSocket = nil
		}
		self.sessionId = sessionId
		webSocket = SRWebSocket(url: server)
		webSocket.delegate = self
		webSocket.open()
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
			try? webSocket.send(string: json)
			
		} catch {
			log.error("Error decoding sendAction encode: \(error.localizedDescription)")
		}
	}
	
	private func receiveAction(json: String) {
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
	
//	@objc(webSocketDidOpen:)
	public func webSocketDidOpen(_ webSocket: SRWebSocket) {
		sendAction("login", params: ["sessionId": sessionId!, "role": "testee"], messageId: 0)
		delegate?.webSocketDidConnect(self)
	}
	
//	@objc(webSocket:didReceiveMessageWithString:)
	public func webSocket(_ webSocket: SRWebSocket, didReceiveMessageWith string: String) {
		receiveAction(json: string)
	}
	
//	@objc(webSocket:didFailWithError:)
	public func webSocket(_ webSocket: SRWebSocket, didFailWithError error: Error) {
		delegate?.webSocket(self, didFailWith: error)
	}
	
//	@objc(webSocket:didCloseWithCode:reason:wasClean:)
	public func webSocket(_ webSocket: SRWebSocket, didCloseWithCode code: Int, reason: String?, wasClean: Bool) {
		delegate?.webSocket(self, didCloseWith: reason)
	}
}
