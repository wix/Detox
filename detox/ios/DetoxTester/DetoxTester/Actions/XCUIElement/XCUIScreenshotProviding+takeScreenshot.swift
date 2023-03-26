//
//  XCUIScreenshotProviding+takeScreenshot.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIScreenshotProviding {
  /// Takes a screenshot of the current screenshot-providing element.
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

///
enum TempPath: String {
  ///
  case element = "elementsScreenshot"

  ///
  case debugRects = "visibilityFailingRects"

  ///
  case debugScreens = "visibilityFailingScreenshots"
}

extension TempPath {
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
