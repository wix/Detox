//
//  WebCodeBuilder+createTypeAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web type action JS code.
extension WebCodeBuilder {
	/// The delay between typing each character.
	private var typeCharacterDelay: Int { 200 }

	/// Creates a web type action JS code.
	func createTypeAction(
		selector: String, text textToType: String, replace shouldReplaceCurrentText: Bool
	) -> String {
		return """
((element, textToType, shouldReplaceCurrentText) => {
	if (!element) {
		throw new Error('Element not found');
	}

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

	\(createMoveCursorToEndAction(selector: selector))

	if (shouldReplaceCurrentText) {
		const range = element.ownerDocument.createRange();
		const sel = window.getSelection();

		if (isContentEditable) {
		  range.selectNodeContents(element);
			sel.removeAllRanges();
			sel.addRange(range);

			element.ownerDocument.execCommand('delete', false, null);
		} else if (isInputField) {
			element.select();

			element.ownerDocument.execCommand('cut');
		}
	}

	if (textToType.length === 0) {
		return;
	}

	let currentIndex = 0;
	const delay = \(typeCharacterDelay);
	const typeCharacters = () => {
		if (isInputField && (element.value.length >= element.getAttribute('maxlength'))) {
		  return;
		}

		if (currentIndex < textToType.length) {
			if (isContentEditable) {
				element.textContent += textToType.charAt(currentIndex);
			} else if (isInputField) {
				element.value += textToType.charAt(currentIndex);
			}

			const inputEvent = new Event('input', { bubbles: true, cancelable: true });
			element.dispatchEvent(inputEvent);

			\(createMoveCursorToEndAction(selector: selector))

			currentIndex++;

			typeCharacters();

			const startTime = new Date().getTime();
			const finishTime = startTime + delay;
			while (new Date().getTime() < finishTime) {
				/* Synchronically wait for type delay to pass */
			}
		}
	};

	typeCharacters();
})(\(selector), '\(textToType)', \(shouldReplaceCurrentText ? "true" : "false"));
"""
	}
}
