//
//  WebCodeBuilder+createExpectation.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web expectation JS code.
extension WebCodeBuilder {
	func createExpectation(expectation: WebExpectationType, params: [String]?, modifiers: [WebModifier]?) -> String {
		let expectationScript: String

		switch expectation {
			case .toExist:
				expectationScript = "element != null"

			case .toHaveText:
				let expectedText = params?.first ?? ""

				let escapedExpectedText = expectedText
					.replacingOccurrences(of: "`", with: "\\`")
					.replacingOccurrences(of: "'", with: "\'")
					.trimmingCharacters(in: .whitespacesAndNewlines)

				expectationScript = "(element.textContent && element.textContent.trim() == `\(escapedExpectedText)`) || " +
					"(element.innerText && element.innerText.trim() == `\(escapedExpectedText)`) || " +
					"(element.value && element.value.trim() == `\(escapedExpectedText)`) || " +
					"`\(escapedExpectedText)` == ''"
		}

		return modifyExpectation(script: expectationScript, modifiers: modifiers)
	}

	private func modifyExpectation(
		script expectationScript: String, modifiers: [WebModifier]?
	) -> String {
		guard let modifiers = modifiers else {
			return expectationScript
		}

		return modifiers.reduce(expectationScript) { (expectationScript, modifier) in
			switch modifier {
				case .not:
					return "!(" + expectationScript + ")"
			}
		}
	}
}
