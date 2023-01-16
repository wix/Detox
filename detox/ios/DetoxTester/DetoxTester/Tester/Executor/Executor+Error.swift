//
//  Executor+Error.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension Executor {
  /// Represents an error caused by `Executor`.
  public enum Error: Swift.Error {
    /// Executor failed to handle white-box handler response.
    case failedToHandleResponse(received: String)
  }
}

/// Extends `Executor.Error` with error description.
extension Executor.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .failedToHandleResponse(let received):
        return "Invalid response received: \(received)"
    }
  }
}
