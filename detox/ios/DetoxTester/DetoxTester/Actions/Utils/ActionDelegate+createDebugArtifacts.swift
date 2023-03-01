//
//  ActionDelegate+createDebugArtifacts.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

///
extension ActionDelegate {
  ///
  func createDebugArtifacts(app: XCUIApplication, element: AnyHashable) throws -> [String: String] {
    var artifacts: [String: String] = [:]

    if shouldCreateDebugVisibilityArtifacts(app) {
      uiLog("creating debug visibility artifacts", type: .debug)
      guard let element = element as? XCUIElement else {
        throw Error.elementIsNotScreenshotProviding
      }

      let tempElementScreenshot = try takeElementScreenshot(
        "debug_visibility_element_rect_\(element.cleanIdentifier)", of: element
      )

      uiLog("created element screenshot: \(tempElementScreenshot)", type: .debug)

      let tempAppScreenshot = try takeAppScreenshot(
        "debug_visibility_screen_\(element.cleanIdentifier)", of: app
      )

      uiLog("created app screenshot: \(tempAppScreenshot)", type: .debug)

      if #available(iOS 16.0, *) {
        artifacts.merge([
          "visibilityFailingScreenshotsURL": try TempPath.debugScreens.temporaryPath().path(),
          "visibilityFailingRectsURL": try TempPath.debugRects.temporaryPath().path()
        ], uniquingKeysWith: { first, _ in first })
      } else {
        artifacts.merge([
          "visibilityFailingScreenshotsURL": try TempPath.debugScreens.temporaryPath().path,
          "visibilityFailingRectsURL": try TempPath.debugRects.temporaryPath().path
        ], uniquingKeysWith: { first, _ in first })
      }
    }

    return artifacts
  }

  private func shouldCreateDebugVisibilityArtifacts(_ app: XCUIApplication) -> Bool {
    let environment = ProcessInfo.processInfo.environment
    let isEnabled = environment[EnvArgKeys.detoxDebugVisibility] == "YES"
    return isEnabled
  }

  private func takeElementScreenshot(
    _ imageName: String?,
    date: Date = Date.now,
    of element: XCUIElement
  ) throws -> [String: String] {
    return try element.takeScreenshot(
      imageName,
      date: date,
      tempPath: .debugRects
    )
  }

  private func takeAppScreenshot(
    _ imageName: String?,
    date: Date = Date.now,
    of app: XCUIApplication
  ) throws -> [String: String] {
    return try app.takeScreenshot(
      imageName,
      date: date,
      tempPath: .debugScreens
    )
  }
}
