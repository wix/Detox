//
//  XCUIElement+screenshot.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement: DetoxInvokeHandler.ScreenshotProvidingProtocol {
  public func screenshotData() -> Data {
    return screenshot().pngRepresentation
  }
}
