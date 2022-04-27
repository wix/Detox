//
//  WebSocket+Config.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Extends `WebSocket` with web-socket related configurations.
extension WebSocket {
  /// Detox Server web-socket address.
  static func detoxServer() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxServer] ?? "ws://localhost:8099"
  }

  /// Session ID for web-socket connection with Detox Server.
  static func detoxSessionId() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxSessionId] ?? "NONE"
  }
}
