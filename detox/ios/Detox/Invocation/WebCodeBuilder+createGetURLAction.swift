//
//  WebCodeBuilder+createGetURLAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web get URL action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that gets the URL of the current page.
	func createGetURLAction() -> String {
		return """
(() => {
  return window.location.href;
})();
"""
	}
}
