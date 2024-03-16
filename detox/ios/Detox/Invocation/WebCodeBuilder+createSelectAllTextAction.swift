//
//  WebCodeBuilder+createSelectAllTextAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web select all text action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that selects all text of an given element.
	func createSelectAllTextAction(selector: String) -> String {
		return """
((element) => {
  if (!element) {
	  throw new Error('Element not found');
  }

  \(createFocusAction(selector: selector))

  const isContentEditable = element.contentEditable === 'true';
  const isInputField = (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA');

  if (!isContentEditable && !isInputField) {
	  throw new Error('Element is not editable');
	}

  if (element.readOnly) {
	  throw new Error('Element is read-only');
	}

	if (element.disabled) {
	  throw new Error('Element is disabled');
  }

  if (isContentEditable) {
		var range = element.ownerDocument.createRange();
		range.selectNodeContents(element);
		var selection = window.getSelection();
		selection.removeAllRanges();
		selection.addRange(range);
  } else if (isInputField) {
		element.focus();
		element.select();
  } else {
    throw new Error('Element text is not selectable');
  }
})(\(selector));
"""
	}
}
