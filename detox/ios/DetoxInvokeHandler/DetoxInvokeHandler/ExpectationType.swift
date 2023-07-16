//
//  ExpectationType.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

/// Representation of an element expectation.
public enum ExpectationType: String, Codable, Equatable {
  /// Expects the element to be visibile.
  case toBeVisible = "toBeVisible"

  /// Expects the element to be focused.
  case toBeFocused = "toBeFocused"

  /// Expects the element to have a specified text.
  case toHaveText = "toHaveText"

  /// Expects the element to have a specified identifier.
  case toHaveId = "toHaveId"

  /// Expects the slider element to have a specified position.
  case toHaveSliderPosition = "toHaveSliderPosition"

  /// Expects the element to exist on the view hierarchy.
  case toExist = "toExist"

  /// Expects the element to have a specified label.
  case toHaveLabel = "toHaveLabel"

  /// Expects the element to have a specified label.
  case toHaveValue = "toHaveValue"

  /// Expects the toggle element to have a specified value.
  case toHaveToggleValue = "toHaveToggleValue"
}
