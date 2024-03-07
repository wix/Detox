//
//  WKWebView+findView.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// Extends WKWebView with the ability to find a web view element.
extension WKWebView {
	class func findView(
		by predicate: Predicate?,
		atIndex index: Int?
	) throws -> WKWebView {
		var webView: WKWebView?

		if let predicate = predicate {
			guard let ancestor = Element(predicate: predicate, index: index).view as? UIView else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: \(predicate.description)")
			}

			webView = try findWebViewDescendant(in: ancestor)
		} else {
			webView = try findWebViewDescendant()
		}

		guard let webView = webView else {
			throw dtx_errorForFatalError(
				"Failed to find web view with predicate: `\(predicate?.description ?? "")` " +
				"at index: `\(index ?? 0)`")
		}

		return webView
	}

	fileprivate class func findWebViewDescendant(
		in ancestor: UIView? = nil
	) throws -> WKWebView? {
		let predicate = NSPredicate.init { (view, _) -> Bool in
			return view is WKWebView
		}

		if let ancestor = ancestor {
			return UIView.dtx_findViews(inHierarchy: ancestor, passing: predicate).firstObject as? WKWebView
		}

		return UIView.dtx_findViewsInAllWindows(passing: predicate).firstObject as? WKWebView
	}
}
