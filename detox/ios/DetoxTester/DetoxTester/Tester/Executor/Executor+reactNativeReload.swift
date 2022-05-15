//
//  Executor+reactNativeReload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func reactNativeReload(messageId: NSNumber) {
    if !isWhiteBoxExecutorAvailable() {
      execLog("can't reload react-native, app is not white-box controlled", type: .error)
    }

    execLog("reloading react-native")
    execute(whiteBoxRequest: .reloadReactNative).assertResponse(equalsTo: .completed)
    sendAction(.reportReady, messageId: messageId)
  }
}
