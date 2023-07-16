//
//  Executor+handleCurrentStatus.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Handles current app-status report.
  func handleCurrentStatus(messageId: NSNumber) {
    // Always report that the app is idle. XCUITest already handles the app-status synchronization.
    sendAction(
      .reportStatus,
      params: [
        "messageId": messageId,
        "status": ["app_status": "idle"]
      ],
      messageId: messageId
    )
  }
}
