//
//  WebJSCodeBuilder.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

class WebJSCodeBuilder {
	private var predicate: WebPredicate?
	private var expectation: WebExpectationType?
	private var params: [String]?
	private var modifiers: [WebModifier]?

	func with(predicate: WebPredicate) -> WebJSCodeBuilder {
		self.predicate = predicate

		return self
	}

	func with(
		expectation: WebExpectationType,
		params: [String]?,
		modifiers: [WebModifier]?
	) -> WebJSCodeBuilder {
		self.expectation = expectation
		self.params = params
		self.modifiers = modifiers

		return self
	}

	func build() -> String {
		return """
		 (() => {
			document.body.style.background = "red";
			return "body background has changed successfully!";
		 })();
		"""
	}
}
