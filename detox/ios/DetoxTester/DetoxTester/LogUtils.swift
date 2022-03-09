//
//  LogUtils.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import OSLog

// MARK: - Logging methods

/// Logs the given `message` with its `type`, under the web-socket logs container.
public func wsLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .webSocket, type: type)
}

/// Logs the given `message` with its `type`, under the synchronization logs container.
public func syncLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .webSocket, type: type)
}

/// Logs the given `message` with its `type`, under the main logs container.
public func mainLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .main, type: type)
}

/// Logs the `message` under a DetoxTester `container` along with its `type`.
fileprivate func detoxLog(message: String, container: OSLog, type: OSLogType) {
  os_log("%{public}@", log: container, type: type, message)
}

// MARK: - Containers

/// Extends `OSLog` with different containers of DetoxTester.
fileprivate extension OSLog {
  private static var subsystem = Bundle.main.bundleIdentifier!

  /// Logs operations related to the web-socket.
  static let webSocket = OSLog(subsystem: subsystem, category: "WebSocket")

  /// Logs operations related to the tester main class (`DetoxTester`).
  static let main = OSLog(subsystem: subsystem, category: "DetoxTester.swift")

  /// Logs operations related to the tester synchronization.
  static let synchronization = OSLog(subsystem: subsystem, category: "Synchronization")
}
