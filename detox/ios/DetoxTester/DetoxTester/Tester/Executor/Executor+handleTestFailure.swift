//
//  Executor+handleTestFailure.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Extends the `Executor` with handler for test failures.
extension Executor {
  /// Handles test failure, by reporting the error message back to the test runner.
  func handleTestFailure(error: Swift.Error, messageId: NSNumber) {
    let errorMessage = "XCUITest executor failed to handle request: \(error)"
    execLog(errorMessage, type: .error)

    var params = ["details": errorMessage]

    if shouldCreateViewHierarchyArtifact() {
      execLog("creating debug view hierarchy artifact", type: .debug)

      let message = WhiteBoxExecutor.Message.captureViewHierarchy(
        viewHierarchyURL: nil
      )

      switch execute(whiteBoxRequest: message) {
        case .string(let path):
          execLog("capture view hierarchy completed", type: .debug)
          params.merge([
            "viewHierarchyURL": path
          ], uniquingKeysWith: { first, _ in first })

        case .completedWithError(let message):
          execLog("capture view hierarchy failed, reason: \(message)", type: .error)

        default:
          fatalError("Should never get here!")
      }
    }

    if case ActionDelegate.Error.errorWithDebugArtifacts(_, let artifactsPaths) = error {
      execLog("enriching params with artifacts: \(artifactsPaths.debugDescription)", type: .debug)
      params = params.merging(artifactsPaths, uniquingKeysWith: { first, _ in first })
    }

    sendAction(
      .reportTestFailed,
      params: params,
      messageId: messageId
    )
  }

  private func shouldCreateViewHierarchyArtifact() -> Bool {
    let environment = ProcessInfo.processInfo.environment
    let isDisabled = environment[EnvArgKeys.detoxDisableHierarchyDump] == "YES"
    return !isDisabled
  }
}
