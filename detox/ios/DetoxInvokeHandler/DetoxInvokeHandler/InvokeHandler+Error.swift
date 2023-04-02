//
//  HandleError.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

extension InvokeHandler {
  /// Represents an error caused by `InvokeHandler`.
  public enum Error: Swift.Error {
    /// No element at specified index.
    case noElementAtIndex(index: Int, elementsCount: Int)

    /// Element's state hasn't changed, avoid handling more while-messages.
    case noStateChangeWhileMessage(withError: String)
  }
}

/// Extends `InvokeHandler.Error` with error description.
extension InvokeHandler.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .noElementAtIndex(let index, let elementsCount):
        if (elementsCount == 0) {
          return "No elements were found for the given matcher"
        }

        return "Index \(index) beyond bounds [0 .. \(elementsCount - 1)] for the given matcher"

      case .noStateChangeWhileMessage(let error):
        return "Element state hasn't changed in the last wait-for expectation action, " +
            "failed to fulfill expectation with error: \(error)"
    }
  }
}
