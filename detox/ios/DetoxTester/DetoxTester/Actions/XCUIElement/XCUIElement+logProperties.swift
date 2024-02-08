//
//  XCUIElement+logProperties.swift (DetoxTester)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation
import XCTest

/// Extends XCUIElement with util for debugging purposes.
extension XCUIElement {
  /// Log all properties of this element. Use for debugging purposes.
  func logProperties() {
    var outCount: UInt32 = 0

    let properties = class_copyPropertyList(type(of: self), &outCount)
    for index in 0...outCount {
      guard let property = properties?[Int(index)] else {
        continue
      }
      let propertyName = String(cString: property_getName(property))
      uiLog("property name: \(propertyName)", type: .debug)
      guard let propertyAttributes = property_getAttributes(property) else {
        continue
      }
      let propertyType = String(cString: propertyAttributes)
      uiLog("property type: \(propertyType)", type: .debug)
    }
  }
}
