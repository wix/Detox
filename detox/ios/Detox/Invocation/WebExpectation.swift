//
//  WebExpectation.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import WebKit

class WebExpectation: CustomStringConvertible {
	var predicate: Predicate?
	var atIndex: Int?
	var webPredicate: WebPredicate
	var webModifiers: [WebModifier]?
	var webExpectation: WebExpectationType
	var params: [String]?

	init(json: [String: Any]) throws {
		self.webExpectation = WebExpectationType(rawValue: json["webExpectation"] as! String)!
		self.params = json["params"] as? [String]
		self.webModifiers = (json["webModifiers"] as? [String])?.compactMap { WebModifier(rawValue: $0) }

		let webPredicateJSON = json["webPredicate"] as? [String: Any]

		guard
			let webPredicateJSON = webPredicateJSON,
			let webPredicateData = try? JSONSerialization.data(withJSONObject: webPredicateJSON),
			let decodedWebPredicate = try? JSONDecoder().decode(WebPredicate.self, from: webPredicateData) else {
			throw dtx_errorForFatalError("Failed to decode WebPredicate \(String(describing: webPredicateJSON))")
		}

		self.webPredicate = decodedWebPredicate
		if let predicateJSON = json["predicate"] as? [String: Any] {
			self.predicate = try Predicate.with(dictionaryRepresentation: predicateJSON)
		}

		self.atIndex = json["atIndex"] as? Int
	}

	var description: String {
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
					if let error = error {
						completionHandler(dtx_errorForFatalError(
							"Failed to evaluate JavaScript on web view: \(webView.debugDescription). " +
							"Error: \(error.localizedDescription)"))
					} else if result as? Bool != true {
						completionHandler(dtx_errorForFatalError(
							"Failed on web expectation: \(webModifiers?.description.uppercased() ?? "") " +
							"\(webExpectation.rawValue.uppercased()) " +
							"with params \(params?.description ?? "") " +
							"on element with \(webPredicate.type.rawValue.uppercased()) == " +
							"'\(webPredicate.value)', web-view: \(webView.debugDescription). " +
							"Got evaluation result: `\(result as? Bool == false ? "FALSY" : String(describing: result))`"))
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

enum WebModifier: String, Codable {
	case not = "not"
}

enum WebExpectationType: String, Codable {
	case toExist = "toExist"
	case toHaveText = "toHaveText"
}
