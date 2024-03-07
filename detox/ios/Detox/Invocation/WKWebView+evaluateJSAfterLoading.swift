//
//  WKWebView+evaluateJSAfterLoading.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// Extends WKWebView with the ability to evaluate JavaScript after the web view has
///  finished loading.
extension WKWebView {
	func evaluateJSAfterLoading(
		_ javaScriptString: String,
		completionHandler: ((Any?, Error?) -> Void)? = nil
	) {
		var observation: NSKeyValueObservation?
		observation = self.observe(
			\.isLoading, options: [.new, .old, .initial]
		) { (webView, change) in
			guard change.newValue == false else { return }

			observation?.invalidate()

			webView.evaluateJavaScript(javaScriptString, completionHandler: completionHandler)
		}
	}
}
