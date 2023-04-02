//
//  XCUIElement+screenshotData.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import DetoxInvokeHandler

extension XCUIElement: DetoxInvokeHandler.ScreenshotProvidingProtocol {
  public func screenshotData() -> Data {
    return screenshotData(testCase: nil)
  }

  public func screenshotData(testCase: XCTestCase?) -> Data {
    let screenshot = screenshot()

    // TODO: this should not be store for long.
    if let testCase = testCase {
      let attachment = XCTAttachment(screenshot: screenshot)
      attachment.lifetime = .deleteOnSuccess
      testCase.add(attachment)
    }

    return screenshot.pngRepresentation
  }
}
