//
//  WebSocket+Config.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Extends `WebSocket` with web-socket related configurations.
extension WebSocket {
  ///
  static func detoxServer() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxServer] ?? "ws://localhost:8099"
  }

  ///
  static func detoxSessionId() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxSessionId] ?? Bundle.main.bundleIdentifier!
  }
}
