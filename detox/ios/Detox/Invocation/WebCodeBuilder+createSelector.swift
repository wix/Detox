//
//  WebCodeBuilder+createSelector.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// This extension is responsible for creating the JavaScript selector for the given predicate type
///  and value.
extension WebCodeBuilder {
	func createSelector(forType type: WebPredicateType, value: String, index: Int?) -> String {
		let index = index ?? 0
		let sanitizedValue = value.replacingOccurrences(of: "'", with: "\\'")

		// Handling XPath separately, for other selectors, we use `getBaseSelector`.
		if type == .xpath {
			return """
(function() {
		var xpathResult = document.evaluate('\(sanitizedValue)', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
		if (xpathResult.snapshotLength > \(index)) {
				return xpathResult.snapshotItem(\(index));
		} else {
				return null;
		}
})()
"""
		}

		let baseSelector = self.getBaseSelector(forType: type, value: sanitizedValue)
		return """
(function() {
	var getAllElements = function(doc, selector) {
		var elements = Array.from(doc.querySelectorAll(selector));
		var frames = doc.querySelectorAll('iframe');
		for (var i = 0; i < frames.length; i++) {
			try {
				var frameDoc = frames[i].contentDocument || frames[i].contentWindow.document;
				var frameElements = getAllElements(frameDoc, selector);
				elements = elements.concat(frameElements);
			} catch(e) {
				/* Probably issues accessing iframe documents (CORS restrictions) */
			}
		}

		return elements;
	};
	var allElements = getAllElements(document, '\(baseSelector)');
	return allElements.length > \(index) ? allElements[\(index)] : null;
})()
"""
	}

	private func getBaseSelector(forType type: WebPredicateType, value: String) -> String {
		switch type {
			case .id:
				return "#\(value)"

			case .className:
				return ".\(value)"

			case .href:
				return "a[href=\"\(value)\"]"

			case .hrefContains:
				return "a[href*=\"\(value)\"]"

			case .cssSelector:
				return value

			case .name:
				return "[name=\"\(value)\"]"

			case .tag, .value:
				return value

			case .label:
				return "[aria-label=\"\(value)\"]"

			case .xpath:
				// Handled separately
				dtx_fatalError("XPath should be handled separately")
		}
	}
}

