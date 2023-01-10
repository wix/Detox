//
//  ActionDelegate+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension ActionDelegate {
  /// Represents an error caused by `ActionDelegate`.
  public enum Error: Swift.Error {
    /// No matching elements.
    case noMatchingElement
  }
}
