//
//  WebActionDelegate+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension WebActionDelegate {
  /// Represents an error caused by `WebActionDelegate` extensions.
  public enum Error: Swift.Error {
    /// Action operation is not supported on iOS.
    case actionNotSupported(action: String)
  }
}

extension WebActionDelegate.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .actionNotSupported(let action):
        return "Web-view action operation is not supported on iOS: \(action)"
    }
  }
}
