//
//  Expectation.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Represents a state expectation of a UI element.
public enum Expectation: Equatable {
  /// Expects the view to be visible on the screen with at least `threshold` percentage.
  case toBeVisible(threshold: Double)

  /// Expects the view to be focused.
  case toBeFocused

  /// Expects the view's text to equal the given `text`.
  case toHaveText(_ text: String)

  /// Expects the view's id (`accessibilityIdentifier`) to equal the given `id`.
  case toHaveId(_ id: String)

  /// Expects the slider element to have the specified `normalizedPosition`, within the provided
  /// `tolerance`, if given any.
  case toHaveSliderInPosition(normalizedPosition: Double, tolerance: Double?)

  /// Expects the element to exist within the app's current UI hierarchy.
  case toExist
}
