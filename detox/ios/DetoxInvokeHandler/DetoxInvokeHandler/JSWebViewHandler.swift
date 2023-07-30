//
//  JSWebViewHandler.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// A struct that represents a JS function that can run on a specified web-view.
public struct JSWebViewHandler {
  /// The JS function that locates the element.
  public let js: String

  /// The web-view element to run on.
  public let webView: AnyHashable

  /// Initializes a new instance of the struct.
  public init(js: String, onWebView webView: AnyHashable) {
    self.js = js
    self.webView = webView
  }
}
