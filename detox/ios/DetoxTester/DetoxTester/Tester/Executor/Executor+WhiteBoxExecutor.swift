//
//  Executor+WhiteBoxExecutor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Used to handle the target application directly (within the app target).
  private var handler: WhiteBoxExecutor? {
    let bundleIdentifier = getAppUnderTestBundleIdentifier()
    let handler = WhiteBoxExecutor.getHandler(for: bundleIdentifier)

    if handler == nil {
      execLog(
        "could not find white-box handler for bundle with identifier: \(bundleIdentifier)",
        type: .debug
      )
    }

    return handler
  }

  /// Indicates whether a white-box executor is available for the current target application.
  func isWhiteBoxExecutorAvailable() -> Bool {
    return handler != nil
  }

  /// Handles the given request in a white-box manner. Do nothing if cannot execute the operation in
  /// a white-box manner.
  func execute(
    whiteBoxRequest message: WhiteBoxExecutor.Message
  ) -> WhiteBoxExecutor.Response {
    guard let handler = handler else {
      execLog(
        "can not handle the request (`\(message)`), no white-box executor exists for the " +
        "target app",
        type: .error
      )

      fatalError("can not call `execute(whiteBoxRequest:)` without a white-box executor")
    }

    let response = handler.execute(message)
    execLog("response received from the white-box executor: \(response)")

    return response
  }
}
