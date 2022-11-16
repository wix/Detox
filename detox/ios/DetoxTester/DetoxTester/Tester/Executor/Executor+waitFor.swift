//
//  Executor+waitFor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  /// Waits for the given app-state to be reached.
  func waitFor(appState state: AppState, messageId: NSNumber) {
    let hasState = getAppUnderTest().wait(for: state.toXCUIState(), timeout: .minute)

    guard hasState else {
      execLog("timeout of minute has reached after waiting for app state \(state)", type: .error)
      fatalError("timeout of minute has reached after waiting for app state \(state)")
    }

    sendAction(state.completionMessage(), messageId: messageId)
  }

  /// Waits for the app to be idle.
  func waitForIdle(messageId: NSNumber) {
    if isWhiteBoxExecutorAvailable() {
      execute(whiteBoxRequest: .waitUntilReady).assertResponse(equalsTo: .completed)
    }

    sendAction(.reportWaitForIdleDone, messageId: messageId)
  }
}

extension Executor {
  /// Enumerates the app states.
  enum AppState {
    /// The app is running in the background.
    case background

    /// The app is running in the foreground.
    case foreground
  }
}

private extension Executor.AppState {
  func toXCUIState() -> XCUIApplication.State {
    switch self {
      case .foreground:
        return .runningForeground

      case .background:
        return .runningBackground
    }
  }

  func completionMessage() -> ResponseMessageType {
    switch self {
      case .foreground:
        return .reportWaitForForegroundDone

      case .background:
        return .reportWaitForBackgroundDone

    }
  }
}
