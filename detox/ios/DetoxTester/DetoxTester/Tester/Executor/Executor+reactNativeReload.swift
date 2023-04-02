//
//  Executor+reactNativeReload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func reactNativeReload(messageId: NSNumber) throws {
    execLog("reloading react-native")

    let message = WhiteBoxExecutor.Message.reloadReactNative
    try execute(whiteBoxRequest: message).assertResponse(equalsTo: .completed, for: message)

    sendAction(.reportReady, messageId: messageId)
  }
}
