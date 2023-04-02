//
//  Executor+setRecordingState.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension Executor {
  /// Sets the sync settings.
  func setRecordingState(params: [String: AnyHashable], messageId: NSNumber) throws {
    if isWhiteBoxExecutorAvailable() {
      try setWhiteBoxRecordingState(params: params, messageId: messageId)
    } else {
      execLog(
        "unable to set recording state, app cannot be white-box handled",
        type: .error
      )
    }

    sendAction(.reportDidSetRecordingState, messageId: messageId)
  }

  private func setWhiteBoxRecordingState(params: [String: AnyHashable], messageId: NSNumber) throws {
    let message = WhiteBoxExecutor.Message.setRecordingState(
      recordingPath: params.recordingPath,
      samplingInterval: params.samplingInterval
    )

    try execute(whiteBoxRequest: message).assertResponse(equalsTo: .completed, for: message)
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var recordingPath: String? {
    return self["recordingPath"] as? String
  }

  var samplingInterval: TimeInterval? {
    return (self["samplingInterval"] as? NSNumber)?.doubleValue
  }
}
