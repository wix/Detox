//
//  WebCodeBuilder+createAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web action JS code.
extension WebCodeBuilder {
	func createAction(
		forAction action: WebActionType,
		params: [Any]?,
		onSelector selector: String
	) throws -> String {
		switch action {
			case .tap:
				return createTapAction(selector: selector)

			case .clearText:
				return createTypeAction(selector: selector, text: "", replace: true)

			case .typeText:
				let text = try extractValueParam(action, params)
				return createTypeAction(selector: selector, text: text, replace: false)

			case .replaceText:
				let text = try extractValueParam(action, params)
				return createTypeAction(selector: selector, text: text, replace: true)

			case .focus:
				return createFocusAction(selector: selector)

			case .getCurrentUrl:
				return createGetURLAction()

			case .getText:
				return createGetTextAction(selector: selector)

			case .getTitle:
				return createGetTitleAction()

			case .moveCursorToEnd:
				return createMoveCursorToEndAction(selector: selector)

			case .runScript, .runScriptWithArgs:
				return try createRunScriptAction(assertedParams(action, params, 1), selector: selector)

			case .selectAllText:
				return createSelectAllTextAction(selector: selector)

			case .scrollToView:
				return createScrollIntoViewAction(selector: selector)
		}
	}

	private func extractValueParam( _ action: WebActionType, _ params: [Any]?) throws -> String {
		let params = try assertedParams(action, params, 1)

		guard let value = params.first as? String else {
			throw dtx_errorForFatalError(
				"Value param for action \(action.rawValue.uppercased()) is not a string (got: \(params))"
			)
		}

		return value
	}

	private func assertedParams(
		_ action: WebActionType, _ params: [Any]?, _ expectedMinCount: Int
	) throws -> [Any] {
		guard let params = params, params.count >= expectedMinCount else {
			throw dtx_errorForFatalError(
				"Expected at-least \(expectedMinCount) params for action " +
				"\(action.rawValue.uppercased()) (got: \(params?.description ?? "none"))"
			)
		}

		return params
	}
}
