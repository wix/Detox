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

  let length = element.value.length;
  element.setSelectionRange(length, length);
})(\(selector));
"""
	}
}
