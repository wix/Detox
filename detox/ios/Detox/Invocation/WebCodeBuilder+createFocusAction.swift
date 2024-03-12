//
//  WebCodeBuilder+createFocusAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web focus action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that focuses on the given element.
	func createFocusAction(selector: String) -> String {
		return """
((element) => {
	if (!element) {
		throw new Error('Element not found');
	}

	if (typeof element.focus !== 'function') {
		throw new Error('Element is not focusable');
	}

  \(createScrollIntoViewAction(selector: selector))

  element.focus();
})(\(selector));
"""
	}
}
