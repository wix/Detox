//
//  URL+WebSocket.swift
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

import Foundation

/// Extends `URL` with computed `webSocketURL`.
extension URL {

  /// Returns the WebSocket URL, as defined in the environment variable.
  static func createWebSocketURL() -> URL {
    let urlString: String = getURLStringFromEnv()
    return .init(string: urlString)!
  }

}

private extension URL {

  static func getURLStringFromEnv() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment["TESTER_WEBSOCKET_URL"]!
  }

}
