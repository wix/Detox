//
//  ServerMessageType+isAsync.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

///
extension ServerMessageType {
  /// Determines whether the server message should be handled in async manner.
  var handleAsync: Bool {
    return self == .currentStatus
  }
}
