//
//  WebAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// Represents a web action to be performed on a web view.
class WebAction: WebInteraction {
	var webAction: WebActionType
	var params: [Any]?

	override init(json: [String: Any]) throws {
		self.webAction = WebActionType(rawValue: json["webAction"] as! String)!
		self.params = json["params"] as? [Any]
		try super.init(json: json)
	}

	override var description: String {
		return "\(webAction.rawValue)"
	}

	func perform(completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		do {
			let jsString = try WebJSCodeBuilder()
				.with(predicate: webPredicate)
				.with(action: webAction, params: params)
				.build()

			guard let webView = try WKWebView.findElement(by: predicate, atIndex: atIndex) else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: `\(predicate?.description ?? "")` " +
					"at index: `\(atIndex ?? 0)`")
			}

			webView.evaluateJSAfterLoading(jsString) { (result, error) in
				if let error = error {
					completionHandler(
						["result": false, "error": error.localizedDescription],
						dtx_errorForFatalError(
							"Failed to evaluate JavaScript on web view: \(webView.debugDescription). " +
							"Error: \(error.localizedDescription)")
					)
				} else if let jsError = (result as? [String: Any])?["error"] as? String {
					completionHandler(
						["result": false, "error": jsError],
						dtx_errorForFatalError(
							"Failed to evaluate JavaScript on web view: \(webView.debugDescription). " +
							"Error: \(jsError)")
					)
				} else if let result = result {
					completionHandler(["result": result], nil)
				} else {
					completionHandler(["result": true], nil)
				}
			}
		} catch {
			completionHandler(nil, error)
		}
	}
}
