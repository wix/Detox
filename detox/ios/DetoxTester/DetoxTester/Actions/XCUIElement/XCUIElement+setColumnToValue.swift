//
//  XCUIElement+setColumnToValue.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Sets the given column to the given value.
  func setColumnToValue(_ value: String, atIndex index: UInt) {
    uiLog("setting column picker at index \(index) to value \(value)")
    let columnPicker = pickerWheels.element(boundBy: Int(index))

    uiLog("picker-wheel value before: \(String(describing: columnPicker.value))", type: .debug)

    // Apparently, `adjust(toPickerWheelValue:)` is not accurate and sometimes stops on a value
    //  that is close to the requested value. However, if the new value is close enough, it has
    //  higher accuracy.
    while (columnPicker.value as? String != value) {
      uiLog(
        "column picker value (\(String(describing: columnPicker.value))) does not " +
        "equal `\(value)`, adjusting the column picker..",
        type: .debug
      )

      let previousValue = columnPicker.value as? String
      columnPicker.adjust(toPickerWheelValue: value)

      if columnPicker.value as? String == previousValue {
        break
      }
    }

    uiLog("picker-wheel value after: \(String(describing: columnPicker.value))", type: .debug)
  }
}
