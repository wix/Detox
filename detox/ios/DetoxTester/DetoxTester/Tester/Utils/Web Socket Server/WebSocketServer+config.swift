//
//  WebSocketServer+makeServer.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension WebSocketServer {
  /// Test target server web-socket port.
  static func testTargetServerPort() -> String {
    let environment = ProcessInfo.processInfo.environment
    return environment[EnvArgKeys.testTargetServerPort]!
  }
}
