//
//  HandleError.swift (DetoxMessageHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

extension MessageHandler {
  /// Represents an error caused by `MessageHandler`.
  public enum Error: Swift.Error {
    /// Action type is illegal.
    case invalidActionType

    /// No element at specified index.
    case noElementAtIndex

    /// Invalid action handling request.
    case invalidActionHandlingRequest
  }
}
