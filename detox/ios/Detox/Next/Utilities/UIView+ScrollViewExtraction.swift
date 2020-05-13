//
//  UIView+ScrollViewExtraction.swift
//  Detox
//
//  Created by Leo Natan (Wix) on 5/13/20.
//  Copyright © 2020 Wix. All rights reserved.
//

import UIKit
import WebKit

extension UIView {
	func extractScrollView() -> UIScrollView {
		if let view = self as? UIScrollView {
			return view
		}
		else if let view = self as? WKWebView {
			return view.scrollView
		} else if ReactNativeSupport.isReactNativeApp && NSStringFromClass(type(of: self)) == "RCTScrollView" {
			return (self.value(forKey: "scrollView") as! UIScrollView)
		}
		
		dtx_fatalError("View “\(self.dtx_shortDescription)” is not an instance of “UISrollView”", view: self)
	}
}
