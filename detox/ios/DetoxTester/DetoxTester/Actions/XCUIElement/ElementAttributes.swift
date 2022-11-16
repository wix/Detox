//
//  ElementAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

/// Represents various attributes of an element.
struct ElementAttributes: Codable, Equatable {
  /// The text value of any textual element.
  let text: String?

  /// A succinct label in a localized string that identifies the accessibility element.
  let label: String?

  /// The placeholder text value of an input element.
  let placeholder: String?

  /// Whether the element is enabled for user interaction.
  let enabled: Bool?

  /// The identifier of the element.
  let identifier: String?

  /// Indicates whether the element is visible.
  let visible: Bool?

  /// The value of the element, where applicable.
  ///
  /// - Note: For example, the position of a slider, or whether a checkbox has been marked.
  let value: String?

  /// The activation point of the element, in element coordinate space.
  let activationPoint: Point?

  /// The activation point of the element (`activationPoint`), normalized ([0.0, 1.0]) in the
  /// element's bounds.
  let normalizedActivationPoint: Point?

  /// Indicates whether the system can compute a hit point for the element.
  let hittable: Bool?

  /// The frame of the element, in screen coordinate space.
  let frame: Rect?

  /// The frame of the element, in container coordinate space. Matches
  /// `accessibilityFrameInContainerSpace`.
  let elementFrame: Rect?

  /// The bounds of the element, in element coordinate space.
  let elementBounds: Rect?

  /// The safe area insets of the element, in element coordinate space.
  let safeAreaInsets: EdgeInsets?

  /// The safe area bounds of the element, in element coordinate space.
  let elementSafeBounds: Rect?

  /// The date of the element (in case the element is a date picker).
  let date: Date?

  /// The normalized slider position (in case the element is a slider).
  let normalizedSliderPosition: CGFloat?

  /// The content offset (in case the element is a scroll view).
  let contentOffset: CGFloat?

  /// The content inset (in case the element is a scroll view).
  let contentInset: CGFloat?

  /// The adjusted content inset (in case the element is a scroll view).
  let adjustedContentInset: CGFloat?

  /// The type of the element.
  let type: String

  /// A localized string that contains a brief description of the result of performing an action
  /// on the accessibility element.
  let hint: String?

  /// Indicates whether a selectable element is currently selected or not.
  let selected: Bool?

  /// Indicates whether the element is focused.
  let focused: Bool?
}

extension ElementAttributes {
  init(text: String?, accessibilityLabel: String?,
       placeholderValue: String?, isEnabled: Bool?, accessibilityIdentifier: String?,
       isVisible: Bool?, accessibilityValue: String?, activationPoint: CGPoint?,
       normalizedActivationPoint: CGPoint?, isHittable: Bool?, frame: CGRect?,
       elementFrame: CGRect?, elementBounds: CGRect?, safeAreaInsets: UIEdgeInsets?,
       elementSafeBounds: CGRect?, datePickerDate: Date?, normalizedSliderPosition: CGFloat?,
       scrollViewContentOffset: CGFloat?, scrollViewContentInset: CGFloat?,
       scrollViewAdjustedContentInset: CGFloat?, elementType: XCUIElement.ElementType,
       accessibilityHint: String?, isSelected: Bool?, isFocused: Bool?) {
    self.text = text
    self.label = accessibilityLabel
    self.placeholder = placeholderValue
    self.enabled = isEnabled
    self.identifier = accessibilityIdentifier
    self.visible = isVisible
    self.value = accessibilityValue
    self.activationPoint = activationPoint?.codable
    self.normalizedActivationPoint = normalizedActivationPoint?.codable
    self.hittable = isHittable
    self.frame = frame?.codable
    self.elementFrame = elementFrame?.codable
    self.safeAreaInsets = safeAreaInsets?.codable
    self.elementBounds = elementBounds?.codable
    self.elementSafeBounds = elementSafeBounds?.codable
    self.date = datePickerDate
    self.normalizedSliderPosition = normalizedSliderPosition
    self.contentOffset = scrollViewContentOffset
    self.contentInset = scrollViewContentInset
    self.adjustedContentInset = scrollViewAdjustedContentInset
    self.type = elementType.asString()
    self.hint = accessibilityHint
    self.selected = isSelected
    self.focused = isFocused
  }
}

/// Represents a point in 2D space.
struct Point: Codable, Equatable {
  /// The x coordinate of the point.
  let x: CGFloat

  /// The y coordinate of the point.
  let y: CGFloat
}

/// Represents a rectangle in 2D space.
struct Size: Codable, Equatable {
  /// The width of the rectangle.
  let height: CGFloat

  /// The height of the rectangle.
  let width: CGFloat
}

/// Represents a rectangle in 2D space.
struct Rect: Codable, Equatable {
  /// The origin of the rectangle.
  let origin: Point

  /// The size of the rectangle.
  let size: Size
}

/// Represents the insets of a rectangle.
struct EdgeInsets: Codable, Equatable {
  /// The top inset of the rectangle.
  let top: CGFloat

  /// The left inset of the rectangle.
  let bottom: CGFloat

  /// The right inset of the rectangle.
  let left: CGFloat

  /// The bottom inset of the rectangle.
  let right: CGFloat
}

extension CGPoint {
  /// A `Point` representation of the `CGPoint`.
  var codable: Point {
    .init(x: x, y: y)
  }
}

extension CGSize {
  /// A `Size` representation of the `CGSize`.
  var codable: Size {
    .init(height: height, width: width)
  }
}

extension CGRect {
  /// A `Rect` representation of the `CGRect`.
  var codable: Rect {
    .init(
      origin: .init(x: origin.x, y: origin.y),
      size: .init(height: size.height, width: size.width)
    )
  }
}

extension UIEdgeInsets {
  /// An `EdgeInsets` representation of the `UIEdgeInsets`.
  var codable: EdgeInsets {
    .init(top: top, bottom: bottom, left: left, right: right)
  }
}
