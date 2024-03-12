//
//  WebInteraction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// Represents a web interaction base class.
class WebInteraction: CustomStringConvertible {
	var predicate: Predicate?
	var atIndex: Int?
	var webPredicate: WebPredicate
	var webAtIndex: Int?

	init(json: [String: Any]) throws {
		let webPredicateJSON = json["webPredicate"] as? [String: Any]

		guard
			let webPredicateJSON = webPredicateJSON,
			let webPredicateData =
				try? JSONSerialization.data(withJSONObject: webPredicateJSON),
			let decodedWebPredicate =
				try? JSONDecoder().decode(WebPredicate.self, from: webPredicateData)
		else {
			throw dtx_errorForFatalError(
				"Failed to decode WebPredicate \(String(describing: webPredicateJSON))")
		}

		self.webPredicate = decodedWebPredicate
		if let predicateJSON = json["predicate"] as? [String: Any] {
			self.predicate = try Predicate.with(dictionaryRepresentation: predicateJSON)
		}

		self.atIndex = json["atIndex"] as? Int
		self.webAtIndex = json["webAtIndex"] as? Int
	}

	var description: String {
		return "WebInteraction"
	}
}

