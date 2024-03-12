//
//  WebCodeBuilder+createScrollIntoViewAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web scroll into view action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that scrolls into view the given element.
	func createScrollIntoViewAction(selector: String) -> String {
		return """
((element) => {
	if (!element) {
	 throw new Error('Element not found');
	}

	if (typeof element.scrollIntoViewIfNeeded === 'function') {
	  element.scrollIntoViewIfNeeded(true);
	} else if (typeof element.scrollIntoView === 'function') {
	  element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
})(\(selector));
"""
	}
}
