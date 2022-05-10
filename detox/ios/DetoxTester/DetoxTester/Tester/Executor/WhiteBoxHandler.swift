//
//  WhiteBoxHandler.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

/// Protocol for handling application operations directly from the app itself, in a "white-box"
/// manner.
///
/// - Note in order to be able to interact with the application using white-box handling, the app
///  must have Detox framework in its dependencies.
protocol WhiteBoxHandlerProtocol: AnyObject {
  /// Sends a message with given parameters to the application, if able, and synchronically wait for
  /// response.
  ///
  /// Returns `nil` if unable to interact with the application directly.
  func send(
    _ action: ServerMessageType,
    withParams: [String: AnyHashable],
    messageId: NSNumber
  ) -> AnyHashable?
}

class WhiteBoxHandler: WhiteBoxHandlerProtocol {
  private let bundleIdentifier: String

  fileprivate init(_ bundleIdentifier: String) {
    self.bundleIdentifier = bundleIdentifier
  }

  func send(
    _ action: ServerMessageType,
    withParams: [String : AnyHashable],
    messageId: NSNumber
  ) -> AnyHashable? {

    // TODO: map bundle identifier to websocket connection
    // send message to websocket connection
    
    return nil
  }
}

extension WhiteBoxHandler {
  /// Stored handlers.
  private static var handlers: [String: WhiteBoxHandler] = [:]

  /// Returns white-box handler, or creates a new one if it was not exist before calling this
  /// method.
  class func getHandler(for bundleIdentifier: String) -> WhiteBoxHandler {
    if !handlers.keys.contains(bundleIdentifier) {
      handlers[bundleIdentifier] = WhiteBoxHandler(bundleIdentifier)
    }

    return handlers[bundleIdentifier]!
  }
}
