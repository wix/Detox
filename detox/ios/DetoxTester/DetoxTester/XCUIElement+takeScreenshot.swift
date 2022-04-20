//
//  XCUIElement+takeScreenshot.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  func takeScreenshot(_ imageName: String?) -> String {
    let screenshot = screenshot()
    let data = screenshot.pngRepresentation
  }
}
