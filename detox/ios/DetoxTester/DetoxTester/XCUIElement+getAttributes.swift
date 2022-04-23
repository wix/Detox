//
//  XCUIElement+getAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import XCTest
import DetoxInvokeHandler

extension XCUIElement {
  /// Returns an object, representing various attributes of the element.
  func getAttributes() -> [String: AnyCodable] {
    let activationPoint = accessibilityActivationPoint.convertToRectCoordinates(frame)
    let normalizedSliderPosition = elementType == .slider ? normalizedSliderPosition : nil

    return ElementAttributes(
      text: nil,
      label: accessibilityLabel,
      placeholder: placeholderValue,
      enabled: isEnabled,
      identifier: identifier,
      visible: isHittable,
      value: accessibilityValue,
      activationPoint: activationPoint,
      normalizedActivationPoint: activationPoint.normalize(in: frame.size),
      hittable: isHittable,
      frame: frame,
      elementFrame: nil,
      elementBounds: nil,
      safeAreaInsets: nil,
      elementSafeBounds: nil,
      date: nil,
      normalizedSliderPosition: normalizedSliderPosition,
      contentOffset: nil,
      contentInset: nil,
      adjustedContentInset: nil,
      traits: accessibilityTraits.asStrings(),
      hint: accessibilityHint,
      isAccessible: isAccessibilityElement,
      selected: isSelected,
      focused: accessibilityElementIsFocused()
    ).dictionary.mapValues { AnyCodable($0) }
  }
}

private extension CGPoint {
  func asDictionary() -> [String: CGFloat] {
    return ["x": self.x, "y": self.y]
  }
}

private extension CGSize {
  func asDictionary() -> [String: CGFloat] {
    return ["width": self.width, "height": self.height]
  }
}

private extension CGRect {
  func asDictionary() -> [String: [String: CGFloat]] {
    return ["origin": self.origin.asDictionary(), "size": self.size.asDictionary()]
  }
}
