//
//  Executor+sendToHome.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension Executor {
  ///
  func sendToHome(messageId: NSNumber) {
    XCUIApplication.springBoard.launch()
    sendAction(.reportSendToHomeDone, messageId: messageId)
  }
}
