//
//  WKWebView+Utils.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import WebKit

extension WKWebView {
	class func dtx_findElement(
		by predicate: Predicate?,
		atIndex index: Int?
	) throws -> WKWebView? {
		if let predicate = predicate {
			guard let ancestor = Element(predicate: predicate, index: index).view as? UIView else {
				throw dtx_errorForFatalError(
					"Failed to find web view with predicate: \(predicate.description)")
			}

			return try findWebViewDescendant(in: ancestor)
		}

		return try findWebViewDescendant()
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
