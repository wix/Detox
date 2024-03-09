//
//  WebCodeBuilder+createMoveCursorToEndAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web move cursor to end action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that moves the cursor to the end of the given element.
	func createMoveCursorToEndAction(selector: String) -> String {
		return """
((element) => {
  if (!element) {
    throw new Error('Element not found');
  }

	\(createFocusAction(selector: selector))

	const getLength = (element) => {
		if (element.value) {
			return element.value.length;
		} else if (element.innerText) {
			return element.innerText.length;
		} else if (element.textContent) {
			return element.textContent.length;
		} else {
			return 0;
		}
	};


	if (typeof element.setSelectionRange === 'function') {
		const length = getLength(element);
		element.setSelectionRange(length, length);
	} else {
		var range = document.createRange();

		range.selectNodeContents(element);
		range.collapse(false);

		var selection = window.getSelection();

		selection.removeAllRanges();
		selection.addRange(range);
	}
})(\(selector));
"""
	}
}
