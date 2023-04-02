//
//  XCUIElement+adjustSlider.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest

extension XCUIElement {
  /// Adjusts the slider to the given value.
  func adjustSlider(to normalizedPosition: Double) {
    guard elementType == .slider else {
      sliders.firstMatch.adjustSlider(to: normalizedPosition)
      return
    }

    adjust(toNormalizedSliderPosition: normalizedPosition)
  }
}
