//
//  WebCodeBuilder+createGetTitleAction.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

/// Extends `WebCodeBuilder` with the ability to create a web get title action JS code.
extension WebCodeBuilder {
	/// Creates a JS code that gets the title of the current page.
	func createGetTitleAction() -> String {
		return """
(() => {
  return document.title;
})();
"""
	}
}
