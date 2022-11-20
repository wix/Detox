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

    /// Returns response of `string`.
    case findElementsByText(text: String)

    /// Returns response of `status`.
    case requestCurrentStatus

    /// Returns reponse of `completed` if succsfully done.
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

    /// Returns reponse of `elementsAttributes` if succsfully done.
    case requestAttributes(
      ofElements: [XCUIElement]
    )
  }
}
