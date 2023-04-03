//
//  XCUIScreenshotProviding+takeScreenshot.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

/// Extends `XCUIScreenshotProviding` with a method to take a screenshot of the current element and save it to a
///  temporary directory.
extension XCUIScreenshotProviding {
  /// Takes a screenshot of the current screenshot-providing element. The screenshot is saved to a temporary directory.
  ///  The path to the screenshot is returned.
  func takeScreenshot(
    _ imageName: String?,
    date: Date,
    tempPath: TempPath
  ) throws -> [String: String] {
    let pngImageData = screenshot().pngRepresentation
    // TODO: maybe path does not exist..
    let path = try URL.makeScreenshotPath(imageName, date: date, tempPath: tempPath)
    try pngImageData.write(to: path)

    return ["screenshotPath": path.path]
  }
}

/// A temporary path. Used for debug visibility artifacts.
enum TempPath: String {
  /// The path for the element screenshot.
  case element = "elementsScreenshot"

  /// The path for element screenshot on failure.
  case debugRects = "visibilityFailingRects"

  /// The path for the app screenshot on failure.
  case debugScreens = "visibilityFailingScreenshots"
}

/// Extends `TempPath` with a method to create a temporary path.
private extension TempPath {
  /// Creates a temporary path. The path is created in the temporary directory.
  func temporaryPath() throws -> URL {
    return try temporaryPath(self.rawValue)
  }

  private func temporaryPath(_ subDirectory: String) throws -> URL {
    let temporaryDirectory = FileManager.default.temporaryDirectory
    let temporarySubDirectory = temporaryDirectory.appendingPathComponent(
      subDirectory,
      isDirectory: true
    )

    try FileManager.default.createDirectory(
      at: temporarySubDirectory,
      withIntermediateDirectories: true,
      attributes: nil
    )

    return temporarySubDirectory
  }
}

/// Extends `URL` with a method to create a screenshot path.
private extension URL {
  /// Creates a screenshot path.
  static func makeScreenshotPath(
    _ imageName: String?,
    date: Date,
    tempPath: TempPath
  ) throws -> URL {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd--HH-mm-ss-SSS"

    let imageName = String(
      format: "ImageScreenshot_%@.png", imageName ?? dateFormatter.string(from: date)
    )

    return try tempPath.temporaryPath().appendingPathComponent(imageName)
  }
}
