//
//  WebCodeBuilder.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Responsible for building the JavaScript code that will be evaluated on a web view.
class WebCodeBuilder {
	private var predicate: WebPredicate?
	private var expectation: WebExpectationType?
	private var expectationParams: [String]?
	private var expectationModifiers: [WebModifier]?
	private var action: WebActionType?
	private var actionParams: [Any]?

	func with(predicate: WebPredicate) -> WebCodeBuilder {
		self.predicate = predicate

		return self
	}

	func with(
		expectation: WebExpectationType,
		params: [String]?,
		modifiers: [WebModifier]?
	) -> WebCodeBuilder {
		self.expectation = expectation
		self.expectationParams = params
		self.expectationModifiers = modifiers

		return self
	}

	func with(action: WebActionType, params: [Any]?) -> WebCodeBuilder {
		self.action = action
		self.actionParams = params

		return self
	}

	func build() throws -> String {
		guard let predicate = predicate else {
			return "return false;"
		}

		let selector = createSelector(forType: predicate.type, value: predicate.value)

		if let expectation = expectation {
			let expectationScript = createExpectation(expectation: expectation, params: expectationParams, modifiers: expectationModifiers);

			return "(() => {" +
			"const truncateString = (string = '', maxLength = 124) =>" +
			"string.length > maxLength ? `${string.substring(0, maxLength)}…`: string;" +
			"let element = \(selector);" +
			"let result = \(expectationScript);" +
			"let elementInfo = element ? {" +
			"'html': truncateString(element.outerHTML)," +
			"'value': element.value, " +
			"'textContent': element.textContent," +
			"'innerText': element.innerText" +
			"} : null;" +
			"return {'result': result, 'element': elementInfo};" +
			"})();"
		} else if let action = action {
			let actionScript = try createAction(
				forAction: action, params: actionParams, onSelector: selector)

			return "(() => {" +
			"try {" +
			"const result = \(actionScript)" +
			"return {'result': result};" +
			"} catch (error) {" +
			"return {'error': error.message};" +
			"}" +
			"})();"
		} else {
			dtx_fatalError("No expectation or action was set")
		}
	}
}
