//
//  Executor+sendToHome.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Extends the Executor with handler for launching the home app (SpringBoard).
extension Executor {
  /// Opens the home (SpringBoard) app.
  func sendToHome(messageId: NSNumber) {
    XCUIApplication.springBoard.launch()
    sendAction(.reportSendToHomeDone, messageId: messageId)
  }
}
