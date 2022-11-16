//
//  Action+name.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

public extension Action {
  /// Returns the action name.
  public var name: String {
    switch self {
      case .tap:
        return "tap"
      case .tapOnAxis:
        return "tapOnAxis"
      case .longPress:
        return "longPress"
      case .longPressAndDrag:
        return "longPressAndDrag"
      case .swipe:
        return "swipe"
      case .screenshot:
        return "screenshot"
      case .getAttributes:
        return "getAttributes"
      case .tapKey:
        return "tapKey"
      case .changeText:
        return "changeText"
      case .scroll:
        return "scroll"
      case .setColumnToValue:
        return "setColumnToValue"
      case .setDatePicker:
        return "setDatePicker"
      case .pinch:
        return "pinch"
      case .adjustSlider:
        return "adjustSlider"
    }
  }
}
