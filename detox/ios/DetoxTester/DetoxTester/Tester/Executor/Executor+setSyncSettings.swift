//
//  Executor+setSyncSettings.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Sets the sync settings.
  func setSyncSettings(params: [String: AnyHashable], messageId: NSNumber) throws {
    if isWhiteBoxExecutorAvailable() {
      try setWhiteBoxSyncSettings(params: params, messageId: messageId)
    } else {
      execLog(
        "unable to set synchronization settings, app cannot be white-box handled",
        type: .error
      )
    }

    sendAction(.reportSetSyncSettingsDone, messageId: messageId)
  }

  private func setWhiteBoxSyncSettings(params: [String: AnyHashable], messageId: NSNumber) throws {
    let waitSecondsForDebugger = params.waitSecondsForDebugger
    if waitSecondsForDebugger != nil {
      Thread.sleep(forTimeInterval: waitSecondsForDebugger!)
    }

    try execute(
      whiteBoxRequest: .setSyncSettings(
        maxTimerWait: params.maxTimerWait,
        blacklistURLs: params.blacklistURLs,
        disabled: params.disabled
      )
    ).assertResponse(equalsTo: .completed)
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var waitSecondsForDebugger: Double? {
    let waitMilisecondsForDebugger = (self["waitForDebugger"] as? NSNumber)?.doubleValue
    return waitMilisecondsForDebugger != nil ? waitMilisecondsForDebugger! / 1000 : nil
  }

  var maxTimerWait: TimeInterval? {
    let maxTimerWaitMiliseconds = (self["maxTimerWait"] as? NSNumber)?.doubleValue
    return maxTimerWaitMiliseconds != nil ? maxTimerWaitMiliseconds! / 1000 : nil
  }

  var blacklistURLs: [String]? {
    self["blacklistURLs"] as? [String]
  }

  var disabled: Bool? {
    let enabled = (self["enabled"] as? NSNumber)?.boolValue
    return enabled != nil ? !enabled! : nil
  }
}
