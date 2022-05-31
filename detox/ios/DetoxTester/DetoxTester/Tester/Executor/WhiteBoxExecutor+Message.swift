//
//  WhiteBoxExecutor+Message.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension WhiteBoxExecutor {
  ///
  enum Message {
    /// Returns response of `completed` if succsfully done.
    case disconnect

    /// Returns response of `completed` if succsfully done.
    case cleanup

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
    case findElementIDByText(text: String)
  }
}
