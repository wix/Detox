//
//  ActionType.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

/// Representation of interaction with an element.
public enum ActionType: String, Codable, Equatable {
  /// Tap on element.
  case tap = "tap"

  /// Tap multiple times on element.
  case multiTap = "multiTap"

  /// Long press on element.
  case longPress = "longPress"

  /// Perform swipe gesture on element.
  case swipe = "swipe"

  /// Take a screenshot of element.
  case takeScreenshot = "takeScreenshot"

  /// Get attributes of element.
  case getAttributes = "getAttributes"

  /// Tap backspace key on the keyboard.
  case tapBackspaceKey = "tapBackspaceKey"

  /// Tap return key on the keyboard.
  case tapReturnKey = "tapReturnKey"

  /// Type text to element.
  case typeText = "typeText"

  /// Replace text of element.
  case replaceText = "replaceText"

  /// Clear element's text.
  case clearText = "clearText"

  /// Perform scroll gesture on element.
  case scroll = "scroll"

  /// Perform swipe gesture on element, to specified edge.
  case scrollTo = "scrollTo"

  /// Change element's column value.
  case setColumnToValue = "setColumnToValue"

  /// Change date picker element's value.
  case setDatePickerDate = "setDatePickerDate"

  /// Perform pinch gesture on element.
  case pinch = "pinch"

  /// Adjust slider element to specified position.
  case adjustSliderToPosition = "adjustSliderToPosition"
}
