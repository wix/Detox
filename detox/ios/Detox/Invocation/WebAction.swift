//
//  WebAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import WebKit

class WebAction: CustomStringConvertible {
	var predicate: Predicate?
	var atIndex: Int?
	var webPredicate: WebPredicate
	var webAction: WebActionType
	var params: [String]?

	init(json: [String: Any]) throws {
		self.webAction = WebActionType(rawValue: json["webAction"] as! String)!

		self.params = json["params"] as? [String]

		let webPredicateJSON = json["webPredicate"] as! [String: Any]
		let webPredicateData = try JSONSerialization.data(withJSONObject: webPredicateJSON)
		let decodedWebPredicate = try JSONDecoder().decode(WebPredicate.self, from: webPredicateData)

		self.webPredicate = decodedWebPredicate
		if let predicateJSON = json["predicate"] as? [String: Any] {
			self.predicate = try Predicate.with(dictionaryRepresentation: predicateJSON)
		}

		self.atIndex = json["atIndex"] as? Int
	}

	func perform(completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		let jsString = WebJSCodeBuilder()
			.with(predicate: webPredicate)
			.with(action: webAction, params: params)
			.build()

		do {
			guard let webView = try WKWebView.dtx_findElement(by: predicate, atIndex: atIndex) else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: `\(predicate?.description ?? "")` " +
					"at index: `\(atIndex ?? 0)`")
			}

			var observation: NSKeyValueObservation?
			observation = webView.observe(
				\.isLoading, options: [.new, .old, .initial]
			) { (webView, change) in
				guard change.newValue == false else { return }

				observation?.invalidate()

				webView.evaluateJavaScript(jsString) { (result, error) in
					if let error = error {
						completionHandler(nil, dtx_errorForFatalError(
							"Failed to evaluate JavaScript on web view: \(webView.debugDescription). " +
							"Error: \(error.localizedDescription)"))
					} else if let result = result as? String {
						completionHandler(["result": result], nil)
					} else {
						completionHandler(["result": true], nil)
					}
				}
			}
		} catch {
			completionHandler(nil, error)
		}

	}

	var description: String {
		return "\(webAction.rawValue)"
	}
}

enum WebActionType: String, Codable {
	case tap = "tap"
	case typeText = "typeText"
	case replaceText = "replaceText"
	case clearText = "clearText"
	case selectAllText = "selectAllText"
	case getText = "getText"
	case scrollToView = "scrollToView"
	case focus = "focus"
	case moveCursorToEnd = "moveCursorToEnd"
	case runScript = "runScript"
	case runScriptWithArgs = "runScriptWithArgs"
	case getCurrentUrl = "getCurrentUrl"
	case getTitle = "getTitle"
}
