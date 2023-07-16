//
//  ScreenshotProvidingProtocol.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Protocol for elements that can provide data representably screenshots.
public protocol ScreenshotProvidingProtocol {
  /// Returns a data screenshot of the element.
  func screenshotData() -> Data
}
