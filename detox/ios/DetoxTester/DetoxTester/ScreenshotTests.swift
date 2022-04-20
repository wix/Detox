//
//  ScreenshotTests.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import DetoxInvokeHandler
import Foundation
import XCTest

class ScreenshotTests: DTXTestCase {
  var app: XCUIApplication!
  var actionDelegate: ActionDelegate!

  override func setUpWithError() throws {
    try super.setUpWithError()

    app = XCUIApplication()
    actionDelegate = ActionDelegate(app)

    app.launch()
  }

  func testScreenshotWithImageName() throws {
    let result = try actionDelegate.takeScreenshot("foo")

    let expectedPath = FileManager.default.temporaryDirectory
      .appendingPathComponent("elementsScreenshot", isDirectory: true)
      .appendingPathComponent("ImageScreenshot_foo.png").path
    XCTAssertEqual(result, ["screenshotPath": expectedPath])
  }

  func testScreenshotWithoutImageName() throws {
    let someDate = Date.init(timeIntervalSince1970: 123456789.5)
    let result = try actionDelegate.takeScreenshot(nil, date: someDate)

    let expectedPath = FileManager.default.temporaryDirectory
      .appendingPathComponent("elementsScreenshot", isDirectory: true)
      .appendingPathComponent("ImageScreenshot_1973-11-29--23-33-09-500.png").path
    XCTAssertEqual(result, ["screenshotPath": expectedPath])
  }
}
