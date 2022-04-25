//
//  XCUIElement+getAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  /// Returns an object, representing various attributes of the element.
  func getAttributes() -> AnyCodable {
    let activationPoint = getActivationPoint()
    let normalizedSliderPosition = elementType == .slider ? normalizedSliderPosition : nil
    
    let attributes = ElementAttributes(
      isAccessibilityElement: isAccessibilityElement,
      text: label,
      accessibilityLabel: label,
      placeholderValue: placeholderValue,
      isEnabled: isEnabled,
      accessibilityIdentifier: identifier,
      isVisible: isHittable,
      accessibilityValue: value as? String ?? (value as? NSObject)?.description,
      activationPoint: activationPoint,
      normalizedActivationPoint: activationPoint.normalize(in: frame.size),
      isHittable: isHittable,
      frame: frame,
      elementFrame: nil,
      elementBounds: nil,
      safeAreaInsets: nil,
      elementSafeBounds: nil,
      datePickerDate: nil,
      normalizedSliderPosition: normalizedSliderPosition,
      scrollViewContentOffset: nil,
      scrollViewContentInset: nil,
      scrollViewAdjustedContentInset: nil,
      elementType: elementType,
      accessibilityHint: accessibilityHint,
      isSelected: isSelected,
      isFocused: hasFocus
    ).encodeToDictionary().mapValues {
      AnyCodable($0)
    }

    return AnyCodable(attributes)
  }

  private func getActivationPoint() -> CGPoint {
    if (accessibilityActivationPoint != .zero) {
      return accessibilityActivationPoint.convertToRectCoordinates(frame)
    } else {
      return frame.center
    }
  }
}
