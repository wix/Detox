//
//  WhiteBoxExecutor.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import UIKit

import DetoxInvokeHandler

/// TODO: refactor

/// Protocol for handling application operations directly from the app itself, in a "white-box"
/// manner.
///
/// - Note in order to be able to interact with the application using white-box handling, the app
///  must have Detox framework in its dependencies.
class WhiteBoxExecutor {
  /// Stored handlers.
  fileprivate static var handlers: [String: WhiteBoxExecutor] = [:]

  /// Used to send messages to the target application (through the injected Detox dylib).
  private let messageSender: AppClientMessageSenderProtocol

  /// Initializes the executor with the given `messageSender`.
  private init(messageSender: AppClientMessageSenderProtocol) {
    self.messageSender = messageSender
  }

  /// Message counter for generating message ids.
  private var messageCounter: Int = 0

  private func createNewMessageId() -> Int {
    DispatchQueue(label: "Increase Message ID Queue").sync { [self] in
      self.messageCounter += 1
    }

    return messageCounter
  }

  /// Sends a message with given `message` to the application using the internal Detox framework
  /// and synchronically waits for a response.
  func execute(_ message: Message) -> Response {
    whiteExecLog("white-box executing: \(message)")
    let messageId = createNewMessageId()

    switch message {
      case .reloadReactNative:
        send("reloadReactNative", andExpectTo: "reactNativeDidReload", messageId: messageId)
        return .completed

      case .deliverPayload(
        let delayPayload,
        let url,
        let sourceApp,
        let detoxUserNotificationDataURL,
        let detoxUserActivityDataURL
      ):
        let message = createMessage(
          type: "deliverPayload",
          params: [
            "delayPayload": delayPayload != nil ? AnyCodable(delayPayload) : nil,
            "url": url != nil ? AnyCodable(url) : nil,
            "sourceApp": sourceApp != nil ? AnyCodable(sourceApp) : nil,
            "detoxUserNotificationDataURL":
              detoxUserNotificationDataURL != nil ? AnyCodable(detoxUserNotificationDataURL) : nil,
            "detoxUserActivityDataURL":
              detoxUserActivityDataURL != nil ? AnyCodable(detoxUserActivityDataURL) : nil
          ],
          messageId: messageId
        )

        let _ = send(message, andExpectToType: "didDeliverPayload", messageId: messageId)
        return .completed

      case .shakeDevice:
        send("shakeDevice", andExpectTo: "deviceDidShake", messageId: messageId)
        return .completed

      case .captureViewHierarchy(let viewHierarchyURL):
        let message = createMessage(
          type: "captureViewHierarchy",
          params: (viewHierarchyURL != nil) ? [
            "viewHierarchyURL": AnyCodable(viewHierarchyURL!)
          ] : [:],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "didCaptureViewHierarchy", messageId: messageId)
        let path = result["path"] as? String
        let error = result["error"] as? String

        return error != nil ? .completedWithError(message: error!) : .string(path!)

      case .waitUntilReady:
        send("waitUntilReady", andExpectTo: "isReady", messageId: messageId)
        return .completed

      case .setSyncSettings(let maxTimerWait, let blacklistURLs, let disabled):
        whiteExecLog(
          "setting synchronization settings, " +
          "max-timer-wait: \(String(describing: maxTimerWait)), " +
          "blacklist-urls: \(String(describing: blacklistURLs)), " +
          "sync-disabled: \(String(describing: disabled))",
          type: .debug
        )

        let message = createMessage(
          type: "setSyncSettings",
          params: [
            "maxTimerWait": maxTimerWait != nil ? AnyCodable(maxTimerWait!) : nil,
            "blacklistURLs": blacklistURLs != nil ? AnyCodable(blacklistURLs!): nil,
            "disabled": disabled != nil ? AnyCodable(disabled!) : nil
          ],
          messageId: messageId
        )

        let _ = send(message, andExpectToType: "didSetSyncSettings", messageId: messageId)

        return .completed

      case .setDatePicker(let date, let element):
        let message = createMessage(
          type: "setDatePicker",
          params: [
            "timeIntervalSince1970": AnyCodable(date.timeIntervalSince1970),
            "elementID": AnyCodable(element.identifier),
            "elementFrame": AnyCodable([
              element.frame.origin.x,
              element.frame.origin.y,
              element.frame.width,
              element.frame.height
            ])
          ],
          messageId: messageId
        )

        let _ = send(message, andExpectToType: "didSetDatePicker", messageId: messageId)
        return .completed

      case .verifyVisibility(let element, let threshold):
        let message = createMessage(
          type: "verifyVisibility",
          params: [
            "threshold": AnyCodable(threshold),
            "elementID": AnyCodable(element.identifier),
            "elementFrame": AnyCodable([
              element.frame.origin.x,
              element.frame.origin.y,
              element.frame.width,
              element.frame.height
            ])
          ],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "didVerifyVisibility", messageId: messageId)
        let isVisible = (result["isVisible"] as! NSNumber).boolValue

        return .boolean(isVisible)

      case .verifyText(let element, let text):
        let message = createMessage(
          type: "verifyText",
          params: [
            "text": AnyCodable(text),
            "elementID": AnyCodable(element.identifier),
            "elementFrame": AnyCodable([
              element.frame.origin.x,
              element.frame.origin.y,
              element.frame.width,
              element.frame.height
            ])
          ],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "didVerifyText", messageId: messageId)
        expectLog("result for verify text: \(result)")
        let hasText = (result["hasText"] as! NSNumber).boolValue

        return .boolean(hasText)

      case .findElementsByText(let text):
        let message = createMessage(
          type: "findElementsByText",
          params: ["text": AnyCodable(text)],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "elementsDidFound", messageId: messageId)

        let elementsIDsAndFrames: [ElementIdentifierAndFrame] = (
          result["elementsIDsAndFrames"] as? [[String: String]] ?? []
        ).map {
          return ElementIdentifierAndFrame(
            identifier: $0["identifier"],
            frame: $0["frame"]
          )
        }

        return elementsIDsAndFrames.count > 0 ?
          .identifiersAndFrames(elementsIDsAndFrames) :
          .failed(reason: "could not find element with text: \(text)")

      case .findElementsByType(let type):
        let message = createMessage(
          type: "findElementsByType",
          params: ["type": AnyCodable(type)],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "elementsDidFound", messageId: messageId)

        let elementsIDsAndFrames: [ElementIdentifierAndFrame] = (
          result["elementsIDsAndFrames"] as? [[String: String]] ?? []
        ).map {
          return ElementIdentifierAndFrame(
            identifier: $0["identifier"],
            frame: $0["frame"]
          )
        }

        return elementsIDsAndFrames.count > 0 ?
          .identifiersAndFrames(elementsIDsAndFrames) :
          .failed(reason: "could not find element with type: \(type)")

      case .findElementsByTraits(let traits):
        let message = createMessage(
          type: "findElementsByTraits",
          params: ["traits": AnyCodable(traits.map { $0.rawValue })],
          messageId: messageId
        )

        let result = send(message, andExpectToType: "elementsDidFound", messageId: messageId)

        let elementsIDsAndFrames: [ElementIdentifierAndFrame] = (
          result["elementsIDsAndFrames"] as? [[String: String]] ?? []
        ).map {
          return ElementIdentifierAndFrame(
            identifier: $0["identifier"],
            frame: $0["frame"]
          )
        }

        return elementsIDsAndFrames.count > 0 ?
          .identifiersAndFrames(elementsIDsAndFrames) :
          .failed(reason: "could not find element with traits: \(traits)")

      case .requestCurrentStatus:
        whiteExecLog(
          "requesting current status, running on thread: \(Thread.current)", type: .debug)

        let message = createMessage(type: "requestCurrentStatus", messageId: messageId)

        let result = send(message, andExpectToType: "currentStatusResult", messageId: messageId)

        guard let statusResult = result["status"] as? [String: Any] else {
          whiteExecLog("current-status result is invalid: \(result)", type: .error)
          fatalError("current-status result is invalid")
        }

        return .status(EquatableDictionary(value: statusResult))

      case .longPressAndDrag(
        let duration,
        let normalizedPositionX,
        let normalizedPositionY,
        let targetElement,
        let normalizedTargetPositionX,
        let normalizedTargetPositionY,
        let speed,
        let holdDuration,
        let element
      ):
        let message = createMessage(
          type: "longPressAndDrag",
          params: [
            "elementID": AnyCodable(element.identifier),
            "elementFrame": AnyCodable([
              element.frame.origin.x,
              element.frame.origin.y,
              element.frame.width,
              element.frame.height
            ]),
            "targetElementID": AnyCodable(targetElement.identifier),
            "targetElementFrame": AnyCodable([
              targetElement.frame.origin.x,
              targetElement.frame.origin.y,
              targetElement.frame.width,
              targetElement.frame.height
            ]),
            "duration": AnyCodable(duration),
            "normalizedPositionX": (normalizedPositionX != nil) ?
                AnyCodable(normalizedPositionX!) : nil,
            "normalizedPositionY": (normalizedPositionY != nil) ?
                AnyCodable(normalizedPositionY!) : nil,
            "normalizedTargetPositionX": (normalizedTargetPositionX != nil) ?
                AnyCodable(normalizedTargetPositionX!) : nil,
            "normalizedTargetPositionY": (normalizedTargetPositionY != nil) ?
                AnyCodable(normalizedTargetPositionY!) : nil,
            "speed": (speed != nil) ? AnyCodable(speed!.rawValue) : nil,
            "holdDuration": (holdDuration != nil) ? AnyCodable(holdDuration!) : nil
          ],
          messageId: messageId
        )

        let _ = send(message, andExpectToType: "didLongPressAndDrag", messageId: messageId)
        return .completed

      case .requestAttributes(let elements):
        let message = createMessage(
          type: "getAttributes",
          params: [
            "elementIDsAndFrames": AnyCodable(elements.map { [
              "identifier": AnyCodable($0.identifier),
              "frame": AnyCodable([
                $0.frame.origin.x,
                $0.frame.origin.y,
                $0.frame.width,
                $0.frame.height
              ])
            ] })
          ],
          messageId: messageId
        )

        let attributes = (send(
          message,
          andExpectToType: "attributes",
          messageId: messageId
        )["elements"]! as! [[String: Any]]
        ).map { EquatableDictionary(value: $0) }

        return .elementsAttributes(attributes)
    }
  }

  private func send(
    _ stringMessage: String,
    andExpectTo stringExpected: String,
    messageId: Int
  ) {
    send(
      createMessage(type: stringMessage, messageId: messageId),
      andExpectTo: createMessage(type: stringExpected, messageId: messageId),
      messageId: messageId
    )
  }

  private func createMessage(
    type: String, params: [String: AnyCodable] = [:], messageId: Int
  ) -> [String: AnyCodable] {
    whiteExecLog("creating message for `\(type)`", type: .debug)

    return [
      "type": AnyCodable(type),
      "params": AnyCodable(params),
      "messageId": AnyCodable(messageId)
    ]
  }

  private func send(
    _ message: [String: AnyCodable],
    andExpectTo expected: [String: AnyCodable],
    messageId: Int
  ) {
    let response = send(message, messageId: messageId)

    if response != expected {
      whiteExecLog(
        "expected to have message with type `\(String(describing: expected))`, " +
        "got result: \(String(describing: response))",
        type: .error
      )
      fatalError("Got unexpected result for white-box message")
    }
  }

  private func send(_ message: [String: AnyCodable], messageId: Int) -> [String: AnyCodable] {
    var result: Data?
    do {
      result = messageSender.sendMessageToClient(
        try JSONEncoder().encode(message),
        messageId: messageId
      )
    }
    catch {
      whiteExecLog("failed to send the message `\(message)`", type: .error)
      fatalError("Failed to create a new message")
    }

    guard let result = result else {
      whiteExecLog("response for `\(message)` is empty", type: .error)
      fatalError("Response for `\(message)` is empty")
    }

    var decoded: [String: AnyCodable]!
    do {
      decoded = try JSONDecoder().decode([String: AnyCodable].self, from: result)
    }
    catch {
      whiteExecLog(
        "response for `\(message)` is invalid (can't be decoded): \(result)",
        type: .error
      )
      fatalError("Response for `\(message)` is invalid")
    }

    return decoded
  }

  private func send(
    _ message: [String: AnyCodable],
    andExpectToType expectedType: String,
    messageId: Int
  ) -> [String: Any] {
    let response = send(message, messageId: messageId)

    guard
      response["type"]?.value as? String == expectedType,
      response["messageId"]?.value as? Int == messageId
    else {
      whiteExecLog(
        "expected to have message with type `\(String(describing: expectedType))` " +
        "and message-id: `\(messageId)`, " +
        "got result: \(String(describing: response))",
        type: .error
      )
      fatalError("Got unexpected result for white-box message")
    }

    guard let params = response["params"]?.value as? [String: Any] else {
      whiteExecLog(
        "got result with invalid params: \(String(describing: response["params"]))",
        type: .error
      )

      fatalError("Got unexpected result for white-box message")
    }

    return params
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
  /// Sets a white-box handler for the given `bundleIdentifier`.
  class func setNewHandler(
    for bundleIdentifier: String, withMessageSender sender: AppClientMessageSenderProtocol
  ) {
    handlers[bundleIdentifier] = .init(messageSender: sender)
  }

  /// Removes a white-box handler for a given `bundleIdentifier`.
  class func removeHandler(with bundleIdentifier: String) {
    handlers.removeValue(forKey: bundleIdentifier)
  }
}
