//
//  WebCodeBuilder+createTapAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web tap action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that taps on the given element.
	func createTapAction(selector: String) -> String {
		return """
((element) => {
	if (!element) {
		throw new Error('Element not found');
	}

  \(createScrollIntoViewAction(selector: selector))

	var mouseDownEvent = new MouseEvent('mousedown', {
		bubbles: true,
		cancelable: true,
		view: window
	});

	var mouseUpEvent = new MouseEvent('mouseup', {
		bubbles: true,
		cancelable: true,
		view: window
	});

	var clickEvent = new MouseEvent('click', {
		bubbles: true,
		cancelable: true,
		view: window
	});

	element.dispatchEvent(mouseDownEvent);
	element.dispatchEvent(mouseUpEvent);
	element.dispatchEvent(clickEvent);
})(\(selector));
"""
	}
}
