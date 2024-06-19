//
//  LogUtils.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import OSLog

// MARK: - Logging methods

/// Logs the given `message` with its `type`, under the main logs container.
func log(_ message: String, _ type: OSLogType = .info) {
  detoxLog(message: message, container: .main, type: type)
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

  // General logs container.
  static let main = OSLog(subsystem: subsystem, category: "MAIN")
}
