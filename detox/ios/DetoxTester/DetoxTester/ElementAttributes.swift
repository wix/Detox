//
//  ElementAttributes.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

/// Represents various attributes of an element.
struct ElementAttributes: Encodable {
  /// The text value of any textual element.
  let text: String?

  /// The label of the element. Matches the `accessibilityLabel`.
  let label: String?

  /// The placeholder text value of an input element.
  let placeholder: String?

  /// Whether the element is enabled for user interaction.
  let enabled: Bool?

  /// The identifier of the element. Matches `accessibilityIdentifier`.
  let identifier: String?

  /// Indicates whether the element is visible.
  let visible: Bool?

  /// The value of the element, where applicable. Matches `accessibilityValue`.
  ///
  /// - Note: For example, the position of a slider, or whether a checkbox has been marked.
  let value: String?

  /// The activation point of the element, in element coordinate space.
  /// Matches `accessibilityActivationPoint`.
  let activationPoint: CGPoint?

  /// The activation point of the element (`activationPoint`), normalized ([0.0, 1.0]) in the
  /// element's bounds.
  let normalizedActivationPoint: CGPoint?

  /// Indicates whether the system can compute a hit point for the element.
  let hittable: Bool?

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
  let date: Date?

  /// The normalized slider position (in case the element is a slider).
  let normalizedSliderPosition: CGFloat?

  /// The content offset (in case the element is a scroll view).
  let contentOffset: CGFloat?

  /// The content inset (in case the element is a scroll view).
  let contentInset: CGFloat?

  /// The adjusted content inset (in case the element is a scroll view).
  let adjustedContentInset: CGFloat?

  /// The combination of accessibility traits that best characterizes the element.
  let traits: [String]?

  /// A localized string that contains a brief description of the result of performing an action
  /// on the accessibility element.
  let hint: String?

  /// A Boolean value that indicates whether the element is an accessibility element that an
  /// assistive app can access.
  let isAccessible: Bool?

  /// Indicates whether a selectable element is currently selected or not.
  let selected: Bool?

  /// Indicates whether the element is focused.
  let focused: Bool?
}

extension Encodable {
  var dictionary: [String: Any] {
    let dictionary = (
      try? JSONSerialization.jsonObject(
        with: JSON.encoder.encode(self)
      )
    ) as? [String: Any] ?? [:]
    
    return dictionary.compactMapValues { $0 }
  }
}
