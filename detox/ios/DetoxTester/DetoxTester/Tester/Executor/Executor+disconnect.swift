//
//  Executor+disconnect.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  ///
  func disconnect(messageId: NSNumber) {
    if isWhiteBoxExecutorAvailable() {
      execute(whiteBoxRequest: .disconnect).assertResponse(equalsTo: .none)
    }

    cleanup(messageId: messageId)
  }
}
