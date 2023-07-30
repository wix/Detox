//
//  ElementMatcher.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a matcher for `InvokeHandler`, in which handles
/// elements matching based on given `pattern`.
public protocol ElementMatcherProtocol {
  /// Returns elements that matches the given `pattern`.
  func match(to pattern: ElementPattern) throws -> [AnyHashable]

  /// Returns web-view elements that matches the given `pattern`. If `pattern` is `nil`, provides
  /// the first web view (list with single element).
  func matchWebViews(to pattern: ElementPattern?) throws -> [AnyHashable]

  /// Returns a JS function that locates an element on the given `webView` based on the given
  /// `pattern`.
  func createJSWebViewElementMatcher(
    on webView: AnyHashable, to pattern: WebElementPattern
  ) throws -> JSWebViewHandler
}
