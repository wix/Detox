//
//  HandleError.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

extension InvokeHandler {
  /// Represents an error caused by `InvokeHandler`.
  public enum Error: Swift.Error {
    /// No element at specified index.
    case noElementAtIndex(index: Int, elementsCount: Int)
  }
}

/// Extends `InvokeHandler.Error` with error description.
extension InvokeHandler.Error {
  var localizedDescription: String {
    switch self {
      case .noElementAtIndex(let index, let elementsCount):
        return "Index \(index) beyond bounds [0 .. \(elementsCount)] for given matcher"
    }
  }
}
