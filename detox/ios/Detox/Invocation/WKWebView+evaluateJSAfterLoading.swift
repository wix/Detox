//
//  WKWebView+evaluateJSAfterLoading.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

fileprivate let log = DetoxLog(category: "WebView")

/// Extends WKWebView with the ability to evaluate JavaScript after the web view has
///  finished loading.
extension WKWebView {
	func evaluateJSAfterLoading(
		_ javaScriptString: String,
		completionHandler: ((Any?, Error?) -> Void)? = nil
	) {
		let cleanJavaScriptString = replaceConsecutiveSpacesAndTabs(in: javaScriptString)
		log.debug("Evaluating JavaScript after loading: `\(cleanJavaScriptString)`")

		var observation: NSKeyValueObservation?
		observation = self.observe(
			\.isLoading, options: [.new, .old, .initial]
		) { (webView, change) in
			guard change.newValue == false else { return }

			observation?.invalidate()

			log.debug("Evaluating JavaScript on web-view: `\(cleanJavaScriptString)`")
			webView.evaluateJavaScript(cleanJavaScriptString, completionHandler: completionHandler)
		}
	}

	private func replaceConsecutiveSpacesAndTabs(in input: String) -> String {
		let pattern = "[ \\t\\r\\n]+"
		let regex = try! NSRegularExpression(pattern: pattern, options: [])
		let range = NSRange(location: 0, length: input.utf16.count)
		let modifiedString = regex.stringByReplacingMatches(in: input, options: [], range: range, withTemplate: " ")
		return modifiedString
	}
}
