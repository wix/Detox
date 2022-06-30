//
//  XCUIElement+getAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  /// Returns a dictionary object, wrapped as `AnyCodable`, representing various attributes of the
  /// element.
  func getAttributes() -> AnyCodable {
    let activationPoint = getActivationPoint()
    let normalizedSliderPosition = elementType == .slider ? normalizedSliderPosition : nil

    // TODO: implement `text` attribute(!)
    // TODO: remove `nil` values.
    // TODO: Update docs.

    let attributes = ElementAttributes(
      text: AnyCodable(label),
      accessibilityLabel: label,
      placeholderValue: placeholderValue,
      isEnabled: isEnabled,
      accessibilityIdentifier: identifier,
      isVisible: isVisible,
      accessibilityValue: value as? String ?? String(describing: value),
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
      $0 as? AnyCodable ?? AnyCodable($0)
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
