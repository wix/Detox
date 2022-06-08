//
//  Executor+reactNativeReload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func reactNativeReload(messageId: NSNumber) {
    execLog("reloading react-native")

    execute(whiteBoxRequest: .reloadReactNative).assertResponse(equalsTo: .completed)

    sendAction(.reportReady, messageId: messageId)
  }
}
