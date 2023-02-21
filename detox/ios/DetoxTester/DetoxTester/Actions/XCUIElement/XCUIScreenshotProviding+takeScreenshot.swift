//
//  XCUIScreenshotProviding+takeScreenshot.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIScreenshotProviding {
  /// Takes a screenshot of the current screenshot-providing element.
  func takeScreenshot(_ imageName: String?, date: Date) throws -> [String: String] {
    let pngImageData = screenshot().pngRepresentation
    let path = try URL.makeScreenshotPath(imageName, date: date)
    try pngImageData.write(to: path)

    return ["screenshotPath": path.path]
  }
}

private extension URL {
  /// Creates a screenshot path.
  static func makeScreenshotPath(_ imageName: String?, date: Date) throws -> URL {
    let dateFormatter = DateFormatter()
    dateFormatter.dateFormat = "yyyy-MM-dd--HH-mm-ss-SSS"

    let imageName = String(
      format: "ImageScreenshot_%@.png", imageName ?? dateFormatter.string(from: date)
    )

    return try temporaryPath("elementsScreenshot").appendingPathComponent(imageName)
  }

  private static func temporaryPath(_ subDirectory: String) throws -> URL {
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
