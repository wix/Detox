//
//  WebCodeBuilder+createGetTextAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web get text action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that gets the text of an given element.
	func createGetTextAction(selector: String) -> String {
		return """
((element) => {
	if (!element) {
	  throw new Error('Element not found');
  }

  return element.textContent.length > 0 ? element.textContent : element.value;
})(\(selector));
"""
	}
}
