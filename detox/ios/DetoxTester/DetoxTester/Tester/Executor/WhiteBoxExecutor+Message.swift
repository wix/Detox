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
    case cleanup

    ///
    case waitFor(_ state: AppState)

    ///
    case setSyncSettings(maxTimerWait: TimeInterval?, blacklistURLs: [String]?, disabled: Bool?)
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
