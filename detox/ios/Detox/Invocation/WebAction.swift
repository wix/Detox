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
		return "WebAction: \(webAction.rawValue)"
	}

	func perform(completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		var jsString: String
		var webView: WKWebView

		do {
			jsString = try WebCodeBuilder()
				.with(predicate: webPredicate, atIndex: webAtIndex)
				.with(action: webAction, params: params)
				.build()

			webView = try WKWebView.findView(by: predicate, atIndex: atIndex)
		} catch {
			completionHandler(nil, error)
			return
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
						"JS exception: \(jsError)")
				)
			} else if let result = (result as? [String: Any])?["result"] as? String {
				completionHandler(["result": result], nil)
			} else {
				completionHandler(nil, nil)
			}
		}
	}
}
