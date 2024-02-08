//
//  Executor+setOrientation.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

extension Executor {
  /// Set the device's orientation.
  func setDeviceOrientation(params: [String: AnyHashable], messageId: NSNumber) throws {
    guard let newOrientation = params.deviceOrientation else {
      throw Error.invalidDeviceOrientation
    }

    XCUIDevice.shared.orientation = newOrientation
    execLog("set orientation to \(newOrientation) done successfully")

    sendAction(.reportSetOrientationDone, messageId: messageId)
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var deviceOrientation: UIDeviceOrientation? {
    guard let orientationString = self["orientation"] as? String else {
      execLog("unknown device orientation: \(self)", type: .error)
      return nil
    }

    switch orientationString {
      case "portrait":
        return .portrait

      case "landscape":
        return .landscapeRight

      default:
        execLog("unknown device orientation provided: \(orientationString)", type: .error)
        return nil
    }
  }
}
