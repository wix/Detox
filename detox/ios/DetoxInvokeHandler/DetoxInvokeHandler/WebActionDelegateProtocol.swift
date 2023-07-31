//
//  WebActionDelegateProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Protocol for classes that can be used as a delegate of `InvokeHandler`, in which handles
/// web actions on a specified web element.
public protocol WebActionDelegateProtocol {
  /// Performs the provided `action` on the specified `element`.
  func act(action: WebAction, on element: AnyHashable, host webView: AnyHashable) throws

  /// Get the text from the specified `element`.
  func getText(of element: AnyHashable) throws -> AnyCodable

  /// Get the current web-view URL from the specified `element`.
  func getCurrentUrl(of element: AnyHashable) throws -> AnyCodable

  /// Get the title of the web-view from the specified `element`.
  func getTitle(of element: AnyHashable) throws -> AnyCodable
}
