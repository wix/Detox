//
//  WebSocketSendActionType.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Type of a web-socket action to be sent from Detox Tester to Detox Server.
enum WebSocketSendActionType: String {
  case reportAppReady = "ready"
  case reportWebSocketDidOpen = "login"
}
