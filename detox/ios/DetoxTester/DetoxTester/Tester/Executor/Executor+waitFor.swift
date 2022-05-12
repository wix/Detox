//
//  Executor+waitFor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  ///
  func waitFor(appState state: AppState, messageId: NSNumber) {
    let hasState = getAppUnderTest().wait(for: state.toXCUIState(), timeout: .minute)

    guard hasState else {
      execLog("timeout of minute has reached after waiting for app state \(state)", type: .error)
      fatalError("timeout of minute has reached after waiting for app state \(state)")
    }

    sendAction(state.completionMessage(), messageId: messageId)
  }
}

extension Executor {
  ///
  enum AppState {
    ///
    case background

    ///
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
