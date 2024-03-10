//
//  WebCodeBuilder+createSelector.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// This extension is responsible for creating the JavaScript selector for the given predicate type
///  and value.
extension WebCodeBuilder {
	func createSelector(forType type: WebPredicateType, value: String, index: Int?) -> String {
		let index = index ?? 0
		let indexStatement = ".item(\(index))"

		let value = value.replacingOccurrences(of: "'", with: "\'")

		switch type {
			case .id:
				if index > 0 {
					// ID should be unique by definition, so if `index` > 0 it's an error.
					return "null"
				}

				return "document.getElementById('\(value)')"

			case .className:
				return "document.getElementsByClassName('\(value)')\(indexStatement)"

			case .cssSelector:
				return "document.querySelectorAll('\(value)')\(indexStatement)"

			case .name:
				return "document.getElementsByName('\(value)')\(indexStatement)"

			case .xpath:
				if index > 0 {
					return "document.evaluate('(\(value))[\(index + 1)]', document, null, " +
						"XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue"
				}

				return "document.evaluate('\(value)', document, null, " +
					"XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue"

			case .href:
				return "document.querySelectorAll('a[href=\"\(value)\"]')\(indexStatement)"

			case .hrefContains:
				return "document.querySelectorAll('a[href*=\"\(value)\"]')\(indexStatement)"

			case .tag:
				return "document.getElementsByTagName('\(value)')\(indexStatement)"

			case .label:
				return "document.querySelectorAll('[aria-label=\"\(value)\"]')\(indexStatement)"

			case .value:
				return "document.querySelectorAll('[value=\"\(value)\"]')\(indexStatement)"

			case .accessibilityType:
				return "document.querySelectorAll('[role=\"\(value)\"]')\(indexStatement)"
		}
	}
}
