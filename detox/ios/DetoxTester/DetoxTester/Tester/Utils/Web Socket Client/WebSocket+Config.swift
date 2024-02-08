//
//  WebSocketClient+Config.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Extends `WebSocketClient` with web-socket client related configurations.
extension WebSocketClient {
  /// Detox Server web-socket address.
  static func detoxServer() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxServer]!
  }

  /// Session ID for web-socket connection with Detox Server.
  static func detoxSessionId() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.detoxSessionId]!
  }
}
