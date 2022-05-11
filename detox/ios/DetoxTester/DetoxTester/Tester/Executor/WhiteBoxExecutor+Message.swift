//
//  WhiteBoxExecutor+Message.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension WhiteBoxExecutor {
  ///
  enum Message {
    ///
    case disconnect

    ///
    case waitFor(_ state: AppState)
  }
}

extension WhiteBoxExecutor.Message {
  ///
  enum AppState {
    ///
    case idle

    ///
    case busy
  }
}
