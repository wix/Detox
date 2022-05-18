//
//  WhiteBoxExecutor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

/// Protocol for handling application operations directly from the app itself, in a "white-box"
/// manner.
///
/// - Note in order to be able to interact with the application using white-box handling, the app
///  must have Detox framework in its dependencies.
class WhiteBoxExecutor {
  /// Stored handlers.
  fileprivate static var handlers: [String: WhiteBoxExecutor] = [:]

  ///
  private let messageSender: AppClientMessageSenderProtocol

  ///
  private init(messageSender: AppClientMessageSenderProtocol) {
    self.messageSender = messageSender
  }

  /// Sends a message with given `message` to the application using the internal Detox framework
  /// and synchronically waits for a response.
  func execute(_ message: Message) -> Response {

    // TODO: handle messages
    
    return .completed
  }
}

extension WhiteBoxExecutor {
  /// Returns white-box handler, or `nil` if no white-box handler for the given `bundleIdentifier`.
  class func getHandler(for bundleIdentifier: String) -> WhiteBoxExecutor? {
    if !handlers.keys.contains(bundleIdentifier) {
      return nil
    }

    return handlers[bundleIdentifier]!
  }
}

extension WhiteBoxExecutor {
  ///
  class func setNewHandler(
    for bundleId: String, withMessageSender sender: AppClientMessageSenderProtocol
  ) {
    handlers[bundleId] = .init(messageSender: sender)
  }
}
