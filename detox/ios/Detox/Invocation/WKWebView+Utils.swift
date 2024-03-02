//
//  WKWebView+Utils.swift (Detox)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import WebKit

extension WKWebView {
	class func dtx_findElement(
		by predicate: Predicate?,
		atIndex index: Int?
	) throws -> WKWebView? {
		if let predicate = predicate {
			let ancestorElement = Element(predicate: predicate, index: index)
			return try findWebViewDescendant(in: ancestorElement.dtx_view)
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
