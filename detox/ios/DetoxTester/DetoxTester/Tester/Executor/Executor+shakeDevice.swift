//
//  Executor+shakeDevice.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  func shakeDevice(messageId: NSNumber) {
    if !isWhiteBoxExecutorAvailable() {
      execLog("shake device failed, target app is not white-box handled", type: .error)
      return
    }

    execute(whiteBoxRequest: .shakeDevice).assertResponse(equalsTo: .completed)
    sendAction(.reportShakeDeviceDone, messageId: messageId)
  }
}
