//
//  WebExpectation.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// The expectation type to evaluate on a web view.
class WebExpectation: WebInteraction {
	var webModifiers: [WebModifier]?
	var webExpectation: WebExpectationType
	var params: [String]?

	override init(json: [String: Any]) throws {
		self.webExpectation = WebExpectationType(rawValue: json["webExpectation"] as! String)!
		self.params = json["params"] as? [String]
		self.webModifiers = (json["webModifiers"] as? [String])?.compactMap { WebModifier(rawValue: $0) }
		try super.init(json: json)
	}

	override var description: String {
		return "WebExpectation: \(webExpectation.rawValue)"
	}

	func evaluate(completionHandler: @escaping (Error?) -> Void) {
		var jsString: String
		var webView: WKWebView

		do {
			jsString = try WebCodeBuilder()
				.with(predicate: webPredicate, atIndex: webAtIndex)
				.with(
					expectation: webExpectation, params: params, modifiers: webModifiers)
				.build()

			webView = try WKWebView.findView(by: predicate, atIndex: atIndex)
		} catch {
			completionHandler(error)
			return
		}

		webView.evaluateJSAfterLoading(jsString) { [self] (result, error) in
			let dict = result as? [String: Any]

			let valueResult = dict?["result"]

			let elementResult = dict?["element"]
			let elementInfo: String =
				elementResult != nil ?
					"info: `\(String(describing: elementResult!))`" :
					"not found"

			let jsError = dict?["error"]
			let jsErrorDescription = jsError != nil ?
					", with JS error: \(String(describing: jsError!))" : ""

			if let error = error {
				completionHandler(dtx_errorForFatalError(
					"Failed to evaluate JavaScript on web view: \(webView.debugDescription). " +
					"Error: \(error.localizedDescription)"))
			} else if valueResult as? Bool != true {
				completionHandler(dtx_errorForFatalError(
					"Failed on web expectation: \(webModifiers?.description.uppercased() ?? "") " +
					"\(webExpectation.rawValue.uppercased()) " +
					"with params \(params?.description ?? "") " +
					"on element with \(webPredicate.type.rawValue.uppercased()) == " +
					"'\(webPredicate.value)', web-view: \(webView.debugDescription). " +
					"Got evaluation result: " +
					"\(valueResult as? Bool == false ? "false" : String(describing: valueResult)). " +
					"Element \(elementInfo)" +
					jsErrorDescription
				))
			} else {
				completionHandler(nil)
			}
		}
	}
}
