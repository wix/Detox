//
//  Executor+handleReactNativeReload.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension Executor {
  func handleReactNativeReload(messageId: NSNumber) {
    let app = XCUIApplication(bundleIdentifier: "com.wix.detox-example")
    app.terminate()
    app.launch()

    sendAction(.reportReady, params: [:], messageId: messageId)
  }
}
