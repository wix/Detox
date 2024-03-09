//
//  WebCodeBuilder+createSelector.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// This extension is responsible for creating the JavaScript selector for the given predicate type
///  and value.
extension WebCodeBuilder {
	func createSelector(forType type: WebPredicateType, value: String, index: Int?) -> String {
		let index = index != nil ? index! : 0
		let value = value.replacingOccurrences(of: "'", with: "/'")

		switch type {
			case .id:
				return "document.getElementById('\(value)')"

			case .className:
				return "document.getElementsByClassName('\(value)').item(\(index))"

			case .cssSelector:
				return "document.querySelector('\(value)')"

			case .name:
				return "document.getElementsByName('\(value)').item(\(index))"

			case .xpath:
				return "document.evaluate('\(value)', document, null, " +
					"XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue"

			case .href:
				return "document.querySelector('a[href=\"\(value)\"]')"

			case .hrefContains:
				return "document.querySelector('a[href*=\"\(value)\"]').href"

			case .tag:
				return "document.getElementsByTagName('\(value)').item(\(index))"

			case .label:
				return "document.querySelector('[aria-label=\"\(value)\"]')"

			case .value:
				return "document.querySelector('[value=\"\(value)\"]')"
				
			case .accessibilityType:
				return "document.querySelector('[role=\"\(value)\"]')"
		}
	}
}
