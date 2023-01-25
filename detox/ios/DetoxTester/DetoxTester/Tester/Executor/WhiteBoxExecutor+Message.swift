//
//  WhiteBoxExecutor+Message.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension WhiteBoxExecutor {
  /// A message to be sent to the white-box executor.
  enum Message {
    /// Returns response of `completed` if succsfully done.
    case reloadReactNative

    /// Returns response of `completed` if succsfully done.
    case shakeDevice

    /// Returns response of `completed` or `completedWithError` if succsfully done.
    case captureViewHierarchy(viewHierarchyURL: URL)

    /// Returns response of `completed` if succsfully done.
    case waitUntilReady

    /// Returns response of `completed` if succsfully done.
    case setSyncSettings(maxTimerWait: TimeInterval?, blacklistURLs: [String]?, disabled: Bool?)

    /// Returns response of `completed` if succsfully done.
    case setDatePicker(toDate: Date, onElement: XCUIElement)

    /// Returns response of `boolean`.
    case verifyVisibility(ofElement: XCUIElement, withThreshold: Double)

    /// Returns response of `boolean`.
    case verifyText(ofElement: XCUIElement, equals: String)

    /// Returns response of `identifiersAndFrames`.
    case findElementsByText(text: String)

    /// Returns response of `identifiersAndFrames`.
    case findElementsByType(type: String)

    /// Returns response of `identifiersAndFrames`.
    case findElementsByTraits(traits: [AccessibilityTrait])

    /// Returns response of `status`.
    case requestCurrentStatus

    /// Returns response of `completed` if successfully done.
    case longPressAndDrag(
      duration: Double,
      normalizedPositionX: Double?,
      normalizedPositionY: Double?,
      targetElement: XCUIElement,
      normalizedTargetPositionX: Double?,
      normalizedTargetPositionY: Double?,
      speed: Action.ActionSpeed?,
      holdDuration: Double?,
      onElement: XCUIElement
    )

    /// Returns response of `elementsAttributes` if successfully done.
    case requestAttributes(
      ofElements: [XCUIElement]
    )
  }
}

extension WhiteBoxExecutor.Message: CustomStringConvertible {
  var description: String {
    switch self {
      case .reloadReactNative:
        return "reload react native"

      case .shakeDevice:
        return "shake device"

      case .captureViewHierarchy(viewHierarchyURL: let viewHierarchyURL):
        return "capture view hierarchy (with destination: \(viewHierarchyURL)"

      case .waitUntilReady:
        return "wait until app is ready"

      case .setSyncSettings(
        maxTimerWait: let maxTimerWait, blacklistURLs: let blacklistURLs, disabled: let disabled):
        return "set synchronization settings (" +
          "max-timer-wait: \(String(describing: maxTimerWait)), " +
          "blacklist-urls: \(String(describing: blacklistURLs)), " +
          "synchronization-disabled: \(String(describing: disabled)))"

      case .setDatePicker(toDate: let toDate, onElement: let onElement):
        return "set picker date (to: \(toDate), " +
          "on element with identifier: `\(onElement.identifier)`"

      case .verifyVisibility(ofElement: let ofElement, withThreshold: let withThreshold):
        return "expect to be visible with threshold of \(withThreshold)%, " +
          "for element with identifier: `\(ofElement.identifier)`"

      case .verifyText(ofElement: let ofElement, equals: let equals):
        return "expect text to equal `\(equals)`, " +
          "for element with identifier: `\(ofElement.identifier)`"

      case .findElementsByText(text: let text):
        return "match elements by text: `\(text)`"

      case .findElementsByType(type: let type):
        return "match elements by type: `\(type)`"

      case .findElementsByTraits(traits: let traits):
        return "match elements by traits: \(traits)"

      case .requestCurrentStatus:
        return "request current app status"

      case .longPressAndDrag(
        duration: _, normalizedPositionX: _, normalizedPositionY: _, targetElement: _,
        normalizedTargetPositionX: _, normalizedTargetPositionY: _, speed: _, holdDuration: _,
        onElement: let onElement
      ):
        return "long press and drag element with identifier: `\(onElement.identifier)`"

      case .requestAttributes(ofElements: let ofElements):
        return "request attributes for elements with identifiers: " +
          "\(ofElements.map({ $0.identifier }))"
    }
  }
}
