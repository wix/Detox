//
//  WebExpectation.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

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
		do {
			let jsString = try WebJSCodeBuilder()
				.with(predicate: webPredicate)
				.with(expectation: webExpectation, params: params, modifiers: webModifiers)
				.build()

			guard let webView = try WKWebView.dtx_findElement(by: predicate, atIndex: atIndex) else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: `\(predicate?.description ?? "")` " +
					"at index: `\(atIndex ?? 0)`")
			}

			var observation: NSKeyValueObservation?
			observation = webView.observe(
				\.isLoading, options: [.new, .old, .initial]
			) { [self] (webView, change) in
				guard change.newValue == false else { return }

				observation?.invalidate()

				webView.evaluateJavaScript(jsString) { [self] (result, error) in
					let valueResult = (result as? [String: Any])?["result"]
					let elementResult = (result as? [String: Any])?["element"]
					let elementInfo: String =
							elementResult != nil ? "HTML: `\(String(describing: elementResult!))`" : "not found"

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
							"\(valueResult as? Bool == false ? "FALSE" : String(describing: valueResult)). " +
							"Element \(elementInfo)"))
					} else {
						completionHandler(nil)
					}
				}
			}
		} catch {
			completionHandler(error)
		}
	}
}
