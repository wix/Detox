//
//  String+Detox.swift
//  DetoxTester
//
//  Created by Asaf Korem (Wix.com).
//

import Foundation

/// Extends `String` with Detox constants.
extension String {
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
