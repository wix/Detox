//
//  WebJSCodeBuilder.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

class WebJSCodeBuilder {
	private var predicate: WebPredicate?
	private var expectation: WebExpectationType?
	private var expectationParams: [String]?
	private var expectationModifiers: [WebModifier]?
	private var action: WebActionType?
	private var actionParams: [Any]?

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
		self.expectationParams = params
		self.expectationModifiers = modifiers

		return self
	}

	func with(action: WebActionType, params: [Any]?) -> WebJSCodeBuilder {
		self.action = action
		self.actionParams = params

		return self
	}

	func build() throws -> String {
		guard let predicate = predicate else {
			return "return false;"
		}

		let elementScript = createJSSelector(forType: predicate.type, value: predicate.value)

		if let expectation = expectation {
			let expectationScript: String
			switch expectation {
				case .toExist:
					expectationScript = "element !== null"
				case .toHaveText:
					let expectedText = expectationParams?.first ?? ""
					expectationScript = "element.textContent === '\(expectedText)'"
			}

			return """
 (() => {
 let element = \(elementScript);
 return { 
 result: \(
   modifyJSExpectation(expectation: expectationScript, withModifiers: expectationModifiers)
 ), 
 element: element ? element.outerHTML : null
 };
 })();
 """
		} else if let action = action {
			let actionScript = try createActionScript(
				forAction: action, params: actionParams, onElementWithScript: elementScript)
			return """
 (() => {
 try {
 \(actionScript)
 } catch (error) {
 return {'error': error.message};
 }
 })();
 """
		} else {
			dtx_fatalError("No expectation or action was set")
		}
	}

	private func modifyJSExpectation(
		expectation: String, withModifiers modifiers: [WebModifier]?
	) -> String {
		guard let modifiers = modifiers else {
			return expectation
		}

		var modifiedExpectation = expectation

		for modifier in modifiers {
			switch modifier {
				case .not:
					modifiedExpectation = "!(\(modifiedExpectation))"
			}
		}

		return modifiedExpectation
	}

	private func createActionScript(
		forAction action: WebActionType,
		params: [Any]?,
		onElementWithScript elementScript: String
	) throws -> String {
		switch action {
			case .tap:
				return "\(elementScript).click();"
			case .clearText:
				return "\(elementScript).value = '';"
			case .typeText:
				guard let text = params?.first else {
					throw dtx_errorForFatalError("Missing text parameter for typeText action")
				}

				return "\(elementScript).value = '\(text)';"
			case .focus:
				return "\(elementScript).focus();"
			case .getCurrentUrl:
				return "return window.location.href;"
			case .getText:
				return "return \(elementScript).textContent;"
			case .getTitle:
				return "return document.title;"
			case .moveCursorToEnd:
				return """
 let element = \(elementScript);
 let length = element.value.length;
 element.setSelectionRange(length, length);
 """
			case .replaceText:
				guard let text = params?.first else {
					throw dtx_errorForFatalError("Missing text parameter for replaceText action")
				}

				return "\(elementScript).value = '\(text)';"
			case .runScript:
				guard let script = params?.first as? String else {
					throw dtx_errorForFatalError(
						"Missing script parameter for runScript action, got: \(String(describing: params))")
				}

				return "return (\(script))(\(elementScript));"

			case .runScriptWithArgs:
				guard let script = params?.first else {
					throw dtx_errorForFatalError(
						"Missing script parameter for runScript action, got: \(String(describing: params))")
				}

				let extraParamsOrNil = params?
					.dropFirst()
					.map({ param in
						let data = try! JSONSerialization.data(withJSONObject: param, options: [])
						return String(data: data, encoding: .utf8)!
					})
					.joined(separator: ",")

				let extraParams = extraParamsOrNil != nil ? ",...\(extraParamsOrNil!)" : ""
				return "return (\(script))(\(elementScript)\(extraParams));"

			case .selectAllText:
				return """
 let element = \(elementScript);
 let length = element.value.length;
 element.setSelectionRange(0, length);
 """
			case .scrollToView:
				return """
 let element = \(elementScript);
 element.scrollIntoView({ behavior: 'auto' });
 """
		}
	}

	private func createJSSelector(forType type: WebPredicateType, value: String) -> String {
		let value = value.replacingOccurrences(of: "'", with: "/'")

		switch type {
			case .id:
				return "document.querySelector('#\(value)')"
			case .className:
				return "document.querySelector('.\(value)')"
			case .cssSelector:
				return "document.querySelector('\(value)')"
			case .name:
				return "document.querySelector('[name=\"\(value)\"]')"
			case .xpath:
				return "document.evaluate('\(value)', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue"
			case .href:
				return "document.querySelector('a[href=\"\(value)\"]')"
			case .hrefContains:
				return "document.querySelector('a[href*=\"\(value)\"]').href"
			case .tag:
				return "document.getElementsByTagName('\(value)').item(0)"
			case .label:
				return "document.querySelector('[aria-label=\"\(value)\"]')"
			case .value:
				return "document.querySelector('[value=\"\(value)\"]')"
			case .accessibilityType:
				return "document.querySelector('[role=\"\(value)\"]')"
		}
	}
}
