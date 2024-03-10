//
//  WKWebView+findView.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

/// Extends WKWebView with the ability to find a web view element.
extension WKWebView {
	/// Finds a web view element by the given `predicate` at the given `index`.
	class func findView(
		by predicate: Predicate?,
		atIndex index: Int?
	) throws -> WKWebView {
		let webView: WKWebView?

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

		var webViews: [WKWebView]
		if let ancestor = ancestor {
			webViews = UIView.dtx_findViews(inHierarchy: ancestor, passing: predicate).compactMap {
				$0 as? WKWebView
			}
		} else {
			webViews = UIView.dtx_findViewsInAllWindows(passing: predicate).compactMap {
				$0 as? WKWebView
			}
		}

		if webViews.count == 0 {
			return nil
		} else if webViews.count > 1 {
			throw dtx_errorForFatalError(
				"Found more than one matching web view in the hierarchy. " +
				"Please specify a predicate to find the correct web view.")
		} else {
			return webViews.first
		}
	}
}
