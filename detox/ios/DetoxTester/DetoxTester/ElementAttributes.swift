//
//  ElementAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

/// Represents various attributes of an element.
struct ElementAttributes {
  /// A Boolean value that indicates whether the element is an accessibility element that can
  /// be accessed from UI tests or from any assistive app.
  let isAccessibilityElement: Bool?

  /// The text value of any textual element.
  let text: String?

  /// A succinct label in a localized string that identifies the accessibility element.
  let accessibilityLabel: String?

  /// The placeholder text value of an input element.
  let placeholderValue: String?

  /// Whether the element is enabled for user interaction.
  let isEnabled: Bool?

  /// The identifier of the element.
  let accessibilityIdentifier: String?

  /// Indicates whether the element is visible.
  let isVisible: Bool?

  /// The value of the element, where applicable.
  ///
  /// - Note: For example, the position of a slider, or whether a checkbox has been marked.
  let accessibilityValue: String?

  /// The activation point of the element, in element coordinate space.
  ///
  /// Matches `accessibilityActivationPoint`.
  let activationPoint: CGPoint?

  /// The activation point of the element (`activationPoint`), normalized ([0.0, 1.0]) in the
  /// element's bounds.
  let normalizedActivationPoint: CGPoint?

  /// Indicates whether the system can compute a hit point for the element.
  let isHittable: Bool?

  /// The frame of the element, in screen coordinate space.
  let frame: CGRect?

  /// The frame of the element, in container coordinate space. Matches
  /// `accessibilityFrameInContainerSpace`.
  let elementFrame: CGRect?

  /// The bounds of the element, in element coordinate space.
  let elementBounds: CGRect?

  /// The safe area insets of the element, in element coordinate space.
  let safeAreaInsets: UIEdgeInsets?

  /// The safe area bounds of the element, in element coordinate space.
  let elementSafeBounds: CGRect?

  /// The date of the element (in case the element is a date picker).
  let datePickerDate: Date?

  /// The normalized slider position (in case the element is a slider).
  let normalizedSliderPosition: CGFloat?

  /// The content offset (in case the element is a scroll view).
  let scrollViewContentOffset: CGFloat?

  /// The content inset (in case the element is a scroll view).
  let scrollViewContentInset: CGFloat?

  /// The adjusted content inset (in case the element is a scroll view).
  let scrollViewAdjustedContentInset: CGFloat?

  /// The type of the element.
  let elementType: XCUIElement.ElementType

  /// A localized string that contains a brief description of the result of performing an action
  /// on the accessibility element.
  let accessibilityHint: String?

  /// Indicates whether a selectable element is currently selected or not.
  let isSelected: Bool?

  /// Indicates whether the element is focused.
  let isFocused: Bool?
}

extension ElementAttributes {
  enum CodingKeys: String, Swift.CodingKey {
    case isAccessibilityElement
    case text
    case label
    case placeholder
    case enabled
    case identifier
    case visible
    case value
    case activationPoint
    case normalizedActivationPoint
    case hittable
    case frame
    case elementFrame
    case safeAreaInsets
    case elementBounds
    case elementSafeBounds
    case date
    case normalizedSliderPosition
    case contentOffset
    case contentInset
    case adjustedContentInset
    case elementType
    case hint
    case selected
    case focused
  }

  enum CGPointCodingKeys: String, Swift.CodingKey {
    case x
    case y
  }

  enum CGSizeCodingKeys: String, Swift.CodingKey {
    case height
    case width
  }

  enum CGRectCodingKeys: String, Swift.CodingKey {
    case origin
    case size
  }

  enum UIEdgeInsetsCodingKeys: String, Swift.CodingKey {
    case top
    case bottom
    case left
    case right
  }
}

extension ElementAttributes: Encodable {
  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)

    try encode(&container, value: isAccessibilityElement, forKey: .isAccessibilityElement)

    try encode(&container, value: text, forKey: .text)

    try encode(&container, value: accessibilityLabel, forKey: .label)

    try encode(&container, value: placeholderValue, forKey: .placeholder)

    try encode(&container, value: isEnabled, forKey: .enabled)

    try encode(&container, value: accessibilityIdentifier, forKey: .identifier)

    try encode(&container, value: isVisible, forKey: .visible)

    try encode(&container, value: accessibilityValue, forKey: .value)

    var activationPointContainer = container.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .activationPoint
    )
    try encode(&activationPointContainer, value: activationPoint?.x, forKey: .x)
    try encode(&activationPointContainer, value: activationPoint?.y, forKey: .y)

    var normalizedActivationPointContainer = container.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .normalizedActivationPoint
    )
    try encode(
      &normalizedActivationPointContainer,
      value: normalizedActivationPoint?.x,
      forKey: .x
    )
    try encode(
      &normalizedActivationPointContainer,
      value: normalizedActivationPoint?.y,
      forKey: .y
    )

    try encode(&container, value: isHittable, forKey: .hittable)

    var frameContainer = container.nestedContainer(
      keyedBy: CGRectCodingKeys.self,
      forKey: .frame
    )

    var frameOriginContainer = frameContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .origin
    )
    try encode(&frameOriginContainer, value: frame?.origin.x, forKey: .x)
    try encode(&frameOriginContainer, value: frame?.origin.y, forKey: .y)

    var frameSizeContainer = frameContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self,
      forKey: .size
    )
    try encode(&frameSizeContainer, value: frame?.size.width, forKey: .width)
    try encode(&frameSizeContainer, value: frame?.size.height, forKey: .height)

    var elementFrameContainer = container.nestedContainer(
      keyedBy: CGRectCodingKeys.self,
      forKey: .elementFrame
    )

    var elementFrameOriginContainer = elementFrameContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .origin
    )
    try encode(&elementFrameOriginContainer, value: elementFrame?.origin.x, forKey: .x)
    try encode(&elementFrameOriginContainer, value: elementFrame?.origin.y, forKey: .y)

    var elementFrameSizeContainer = elementFrameContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self,
      forKey: .size
    )
    try encode(&elementFrameSizeContainer, value: elementFrame?.size.width, forKey: .width)
    try encode(&elementFrameSizeContainer, value: elementFrame?.size.height, forKey: .height)

    var safeAreaInsetsContainer = container.nestedContainer(
      keyedBy: UIEdgeInsetsCodingKeys.self,
      forKey: .safeAreaInsets
    )
    try encode(&safeAreaInsetsContainer, value: safeAreaInsets?.top, forKey: .top)
    try encode(&safeAreaInsetsContainer, value: safeAreaInsets?.bottom, forKey: .bottom)
    try encode(&safeAreaInsetsContainer, value: safeAreaInsets?.left, forKey: .left)
    try encode(&safeAreaInsetsContainer, value: safeAreaInsets?.right, forKey: .right)

    var elementBoundsContainer = container.nestedContainer(
      keyedBy: CGRectCodingKeys.self,
      forKey: .elementBounds
    )

    var elementBoundsOriginContainer = elementBoundsContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .origin
    )
    try encode(&elementBoundsOriginContainer, value: elementBounds?.origin.x, forKey: .x)
    try encode(&elementBoundsOriginContainer, value: elementBounds?.origin.y, forKey: .y)

    var elementBoundsSizeContainer = elementBoundsContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self,
      forKey: .size
    )
    try encode(
      &elementBoundsSizeContainer,
      value: elementBounds?.size.width,
      forKey: .width
    )
    try encode(
      &elementBoundsSizeContainer,
      value: elementBounds?.size.height,
      forKey: .height
    )

    var elementSafeBoundsContainer = container.nestedContainer(
      keyedBy: CGRectCodingKeys.self,
      forKey: .elementSafeBounds
    )

    var elementSafeBoundsOriginContainer = elementSafeBoundsContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self,
      forKey: .origin
    )
    try encode(&elementSafeBoundsOriginContainer, value: elementSafeBounds?.origin.x, forKey: .x)
    try encode(&elementSafeBoundsOriginContainer, value: elementSafeBounds?.origin.y, forKey: .y)

    var elementSafeBoundsSizeContainer = elementSafeBoundsContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self,
      forKey: .size
    )
    try encode(
      &elementSafeBoundsSizeContainer,
      value: elementSafeBounds?.size.width,
      forKey: .width
    )
    try encode(
      &elementSafeBoundsSizeContainer,
      value: elementSafeBounds?.size.height,
      forKey: .height
    )

    try encode(&container, value: datePickerDate, forKey: .date)

    try encode(&container, value: normalizedSliderPosition, forKey: .normalizedSliderPosition)

    try encode(&container, value: scrollViewContentOffset, forKey: .contentOffset)

    try encode(&container, value: scrollViewContentInset, forKey: .contentInset)

    try encode(&container, value: elementType.asString(), forKey: .elementType)

    try encode(&container, value: accessibilityHint, forKey: .hint)

    try encode(&container, value: isSelected, forKey: .selected)

    try encode(&container, value: isFocused, forKey: .focused)
  }

  private func encode<T: Encodable, K: Swift.CodingKey>(
    _ container: inout KeyedEncodingContainer<K>,
    value: T?,
    forKey key: KeyedEncodingContainer<K>.Key
  ) throws {
    guard let value = value
    else {
      return
    }

    try container.encode(AnyCodable(value), forKey: key)
  }
}

extension ElementAttributes: Decodable {
  init(from decoder: Decoder) throws {
    let values = try decoder.container(keyedBy: CodingKeys.self)

    isAccessibilityElement = try values.decode(Bool.self, forKey: .isAccessibilityElement)

    text = try values.decode(String.self, forKey: .text)

    accessibilityLabel = try values.decode(String.self, forKey: .label)

    placeholderValue = try values.decode(String.self, forKey: .placeholder)

    isEnabled = try values.decode(Bool.self, forKey: .enabled)

    accessibilityIdentifier = try values.decode(String.self, forKey: .identifier)

    isVisible = try values.decode(Bool.self, forKey: .visible)

    accessibilityValue = try values.decode(String.self, forKey: .value)

    let activationPointContainer = try values.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .activationPoint
    )
    activationPoint = .init(
      x: try activationPointContainer.decode(CGFloat.self, forKey: .x),
      y: try activationPointContainer.decode(CGFloat.self, forKey: .y)
    )

    let normalizedActivationPointContainer = try values.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .normalizedActivationPoint
    )
    normalizedActivationPoint = .init(
      x: try normalizedActivationPointContainer.decode(CGFloat.self, forKey: .x),
      y: try normalizedActivationPointContainer.decode(CGFloat.self, forKey: .y)
    )

    isHittable = try values.decode(Bool.self, forKey: .hittable)

    let frameContainer = try values.nestedContainer(
      keyedBy: CGRectCodingKeys.self, forKey: .frame
    )
    let frameOriginContainer = try frameContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .origin
    )
    let frameSizeContainer = try frameContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self, forKey: .size
    )
    frame = .init(
      origin: .init(
        x: try frameOriginContainer.decode(CGFloat.self, forKey: .y),
        y: try frameOriginContainer.decode(CGFloat.self, forKey: .y)
      ),
      size: .init(
        width: try frameSizeContainer.decode(CGFloat.self, forKey: .width),
        height: try frameSizeContainer.decode(CGFloat.self, forKey: .height)
      )
    )

    let elementFrameContainer = try values.nestedContainer(
      keyedBy: CGRectCodingKeys.self, forKey: .elementFrame
    )
    let elementFrameOriginContainer = try elementFrameContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .origin
    )
    let elementFrameSizeContainer = try elementFrameContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self, forKey: .size
    )
    elementFrame = .init(
      origin: .init(
        x: try elementFrameOriginContainer.decode(CGFloat.self, forKey: .y),
        y: try elementFrameOriginContainer.decode(CGFloat.self, forKey: .y)
      ),
      size: .init(
        width: try elementFrameSizeContainer.decode(CGFloat.self, forKey: .width),
        height: try elementFrameSizeContainer.decode(CGFloat.self, forKey: .height)
      )
    )

    let elementBoundsContainer = try values.nestedContainer(
      keyedBy: CGRectCodingKeys.self, forKey: .elementBounds
    )
    let elementBoundsOriginContainer = try elementBoundsContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .origin
    )
    let elementBoundsSizeContainer = try elementBoundsContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self, forKey: .size
    )
    elementBounds = .init(
      origin: .init(
        x: try elementBoundsOriginContainer.decode(CGFloat.self, forKey: .y),
        y: try elementBoundsOriginContainer.decode(CGFloat.self, forKey: .y)
      ),
      size: .init(
        width: try elementBoundsSizeContainer.decode(CGFloat.self, forKey: .width),
        height: try elementBoundsSizeContainer.decode(CGFloat.self, forKey: .height)
      )
    )

    let elementFrameContainer = try values.nestedContainer(
      keyedBy: CGRectCodingKeys.self, forKey: .elementFrame
    )
    let elementFrameOriginContainer = try elementFrameContainer.nestedContainer(
      keyedBy: CGPointCodingKeys.self, forKey: .origin
    )
    let elementFrameSizeContainer = try elementFrameContainer.nestedContainer(
      keyedBy: CGSizeCodingKeys.self, forKey: .size
    )
    elementFrame = .init(
      origin: .init(
        x: try elementFrameOriginContainer.decode(CGFloat.self, forKey: .y),
        y: try elementFrameOriginContainer.decode(CGFloat.self, forKey: .y)
      ),
      size: .init(
        width: try elementFrameSizeContainer.decode(CGFloat.self, forKey: .width),
        height: try elementFrameSizeContainer.decode(CGFloat.self, forKey: .height)
      )
    )

    let safeAreaInsetsContainer = try values.nestedContainer(
      keyedBy: UIEdgeInsetsCodingKeys.self, forKey: .safeAreaInsets
    )
    safeAreaInsets = .init(
      top: try safeAreaInsetsContainer.decode(CGFloat.self, forKey: .top),
      left: try safeAreaInsetsContainer.decode(CGFloat.self, forKey: .left),
      bottom: try safeAreaInsetsContainer.decode(CGFloat.self, forKey: .bottom),
      right: try safeAreaInsetsContainer.decode(CGFloat.self, forKey: .right)
    )
    datePickerDate = try values.decode(Date.self, forKey: .date)

    // normalizedSliderPosition =

    scrollViewContentOffset = try values.decode(CGFloat.self, forKey: .contentOffset)

    scrollViewContentInset = try values.decode(CGFloat.self, forKey: .contentInset)

    scrollViewAdjustedContentInset = try values.decode(CGFloat.self, forKey: .adjustedContentInset)

//    elementType = try values.decode(XCUIElement.ElementType.self, forKey: .elementType)

    accessibilityHint = try values.decode(String.self, forKey: .hint)

    isSelected = try values.decode(Bool.self, forKey: .selected)

    isFocused = try values.decode(Bool.self, forKey: .focused)
  }
}
