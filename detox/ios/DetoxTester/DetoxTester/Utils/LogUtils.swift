//
//  LogUtils.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import OSLog

// MARK: - Logging methods

/// Logs the given `message` with its `type`, under the test-case logs container.
func testCaseLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .testCase, type: type)
}

/// Logs the given `message` with its `type`, under the web-socket logs container.
func wsLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .webSocket, type: type)
}

/// Logs the given `message` with its `type`, under the synchronization logs container.
func syncLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .synchronization, type: type)
}

/// Logs the given `message` with its `type`, under the main logs container.
func mainLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .main, type: type)
}

/// Logs the given `message` with its `type`, under the react-native logs container.
func rnLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .reactNative, type: type)
}

/// Logs the given `message` with its `type`, under the tester executor logs container.
func execLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .executor, type: type)
}

/// Logs the given `message` with its `type`, under the tester white-box executor logs container.
func whiteExecLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .whiteBoxExecutor, type: type)
}

/// Logs the given `message` with its `type`, under the tester matcher container.
func matcherLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .matcher, type: type)
}

/// Logs the given `message` with its `type`, under the tester actions container.
func uiLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .action, type: type)
}

/// Logs the given `message` with its `type`, under the tester expectations container.
func expectLog(_ message: String, type: OSLogType = .info) {
  detoxLog(message: message, container: .expect, type: type)
}

/// Logs the `message` under a DetoxTester `container` along with its `type`.
fileprivate func detoxLog(message: String, container: OSLog, type: OSLogType) {
  // TODO: reduce logs amount.
  os_log("%{public}@", log: container, type: type, message)
}

// MARK: - Containers

/// Extends `OSLog` with different containers of DetoxTester.
fileprivate extension OSLog {
  private static var subsystem = Bundle.main.bundleIdentifier!

  /// Logs operations related to the test-case lifecycle.
  static let testCase = OSLog(subsystem: subsystem, category: "TestCaseLifecycle")

  /// Logs operations related to the web-socket.
  static let webSocket = OSLog(subsystem: subsystem, category: "WebSocketClient")

  /// Logs operations related to the tester main class (`DetoxTester`).
  static let main = OSLog(subsystem: subsystem, category: "DetoxTester.swift")

  /// Logs operations related to React-Native utils.
  static let reactNative = OSLog(subsystem: subsystem, category: "ReactNative")

  /// Logs operations related to the tester synchronization.
  static let synchronization = OSLog(subsystem: subsystem, category: "Synchronization")

  /// Logs operations related to the tester executor.
  static let executor = OSLog(subsystem: subsystem, category: "Executor")

  /// Logs operations related to the tester white-box executor.
  static let whiteBoxExecutor = OSLog(subsystem: subsystem, category: "WhiteBoxExecutor")

  /// Logs operations related to the tester's element-matcher.
  static let matcher = OSLog(subsystem: subsystem, category: "ElementMatcher")

  /// Logs operations related to the tester's actions.
  static let action = OSLog(subsystem: subsystem, category: "UIActions")

  /// Logs operations related to the tester's expectations.
  static let expect = OSLog(subsystem: subsystem, category: "Expectations")
}
