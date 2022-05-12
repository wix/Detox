//
//  Executor+setSyncSettings.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  ///
  func setSyncSettings(params: [String: AnyHashable], messageId: NSNumber) {
    if isWhiteBoxExecutorAvailable() {
      setWhiteBoxSyncSettings(params: params, messageId: messageId)
    } else {
      execLog(
        "unable to set synchronization settings, app cannot be white-box handled",
        type: .error
      )
    }

    sendAction(.reportSetSyncSettingsDone, messageId: messageId)
  }

  private func setWhiteBoxSyncSettings(params: [String: AnyHashable], messageId: NSNumber) {
    let waitMilisecondsForDebugger = (params["waitForDebugger"] as? NSNumber)?.doubleValue
    if waitMilisecondsForDebugger != nil {
      let seconds = waitMilisecondsForDebugger! / 1000
      Thread.sleep(forTimeInterval: seconds)
    }

    let maxTimerWaitMiliseconds = (params["maxTimerWait"] as? NSNumber)?.doubleValue
    let maxTimerWait = maxTimerWaitMiliseconds != nil ? maxTimerWaitMiliseconds! / 1000 : nil

    let blacklistURLs = params["blacklistURLs"] as? [String]

    let enabled = (params["enabled"] as? NSNumber)?.boolValue
    let disabled = enabled != nil ? !enabled! : nil

    execute(
      whiteBoxRequest: .setSyncSettings(
        maxTimerWait: maxTimerWait,
        blacklistURLs: blacklistURLs,
        disabled: disabled
      )
    ).assertResponse(equalsTo: .none)
  }
}
