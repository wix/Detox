//
//  WebExpectation.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import WebKit

class WebExpectation {
	var webExpectation: WebExpectationType
	var params: [String]?
	var predicate: Predicate?
	var atIndex: Int?
	var webModifiers: [WebModifier]?
	var webPredicate: WebPredicate

	init(json: [String: Any]) throws {
		self.webExpectation = WebExpectationType(rawValue: json["webExpectation"] as! String)!
		self.params = json["params"] as? [String]
		self.webModifiers = (json["webModifiers"] as? [String])?.compactMap { WebModifier(rawValue: $0) }

		guard
			let webPredicateJSON = json["webPredicate"] as? [String: Any],
			let webPredicateData = try? JSONSerialization.data(withJSONObject: webPredicateJSON),
			let decodedWebPredicate = try? JSONDecoder().decode(WebPredicate.self, from: webPredicateData) else {
			throw dtx_errorForFatalError("Failed to decode WebPredicate")
		}
		self.webPredicate = decodedWebPredicate
		if let predicateJSON = json["predicate"] as? [String: Any] {
			self.predicate = try Predicate.with(dictionaryRepresentation: predicateJSON)
		}

		self.atIndex = json["atIndex"] as? Int
	}

	func evaluate(completionHandler: @escaping (Error?) -> Void) {
		do {
			guard let webView = try WKWebView.dtx_findElement(by: predicate, atIndex: atIndex) else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: `\(predicate?.description ?? "")` " +
					"at index: `\(atIndex ?? 0)`")
			}

			let jsString = WebJSCodeBuilder()
				.with(predicate: webPredicate)
				.with(expectation: webExpectation, params: params, modifiers: webModifiers)
				.build()

			var observation: NSKeyValueObservation?
			observation = webView.observe(
				\.isLoading, options: [.new, .old, .initial]
			) { [self] (webView, change) in
				guard change.newValue == false else { return }

				observation?.invalidate()

				webView.evaluateJavaScript(jsString) { [self] (result, error) in
					if let error = error {
						completionHandler(error)
					} else if result as? Bool != true {
						completionHandler(dtx_errorForFatalError(
							"Failed on web expectation: \(webModifiers?.description ?? "") " +
							"\(webExpectation.rawValue.capitalized) " +
							"with params \(params?.description ?? "") " +
							"on element with \(webPredicate.type.rawValue.capitalized) == " +
							"'\(webPredicate.value)', web-view: \(webView.debugDescription). " +
							"Got evaluation result: `\(String(describing: result))`"))
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

class WebPredicate: Codable {
	let type: WebPredicateType
	let value: String
}

enum WebExpectationType: String, Codable {
	case toExist = "toExist"
	case toHaveText = "toHaveText"
}

enum WebPredicateType: String, Codable {
	case id = "id"
	case className = "className"
	case cssSelector = "cssSelector"
	case name = "name"
	case xpath = "xpath"
	case href = "href"
	case hrefContains = "hrefContains"
	case tag = "tag"
	case label = "label"
	case value = "value"
	case accessibilityType = "accessibilityType"
}
