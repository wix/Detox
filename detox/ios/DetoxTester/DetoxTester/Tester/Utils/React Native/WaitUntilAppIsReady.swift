//
//  WaitUntilAppIsReady.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Wait on thread until app is ready.
func waitUntilAppIsReady(_ app: XCUIApplication) {
  rnLog("waiting for app to be ready")

  let result = app.wait(for: .runningForeground, timeout: 30)
  guard result == true else {
    rnLog("app is not ready after 30 seconds of waiting! (state: \(app.state))", type: .error)
    fatalError("app is not ready after 30 seconds of waiting")
  }

  rnLog("application is ready")
}
