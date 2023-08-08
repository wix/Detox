//
//  WebViewElementTuple.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Used to identify a web view element.
public typealias WebViewElementTuple = (
  webView: AnyHashable,
  element: AnyHashable?,
  matchedWebViewElements: Int
)
