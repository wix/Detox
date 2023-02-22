//
//  AppClientMessageSenderProtocol.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// A protocol for sending messages to the Detox app client.
protocol AppClientMessageSenderProtocol {
  /// Sends a message to the Detox app client.
  func sendMessageToClient(_ data: Data, messageId: Int) -> Data
}
