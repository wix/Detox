//
//  ActionDelegateProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Protocol for classes that can be used as a delegate of `InvokeHandler`, in which handles
/// actions on a specified element.
public protocol ActionDelegateProtocol {
  /// Performs the provided `action` on the specified `element`.
  func act(action: Action, on element: AnyHashable) throws

  /// Get the attributes from a list of `elements`. Returns a dictionary in case of one element
  /// only, or list of dictionaries, each represents the state attributes (specifically, the
  /// available accessibility information) of the element.
  func getAttributes(from elements: [AnyHashable]) throws -> AnyCodable

  /// Takes a screenshot and saves the image as `imageName`.
  func takeScreenshot(_ imageName: String?) throws -> AnyCodable
}
