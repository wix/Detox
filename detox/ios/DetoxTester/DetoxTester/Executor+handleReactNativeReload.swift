//
//  Executor+handleReactNativeReload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func handleReactNativeReload(messageId: NSNumber) {
    execLog("reloading react native (relaunch application)")

    let app = getAppUnderTest()
    app.terminate()
    app.launch()

    sendAction(.reportReady, params: [:], messageId: messageId)
  }
}
