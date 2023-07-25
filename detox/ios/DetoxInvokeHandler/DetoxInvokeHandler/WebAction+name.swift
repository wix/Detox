//
//  WebAction+name.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

public extension WebAction {
  /// Returns the action name.
  var name: String {
    switch self {
      case .tap:
        return "tap"
      case .typeText:
        return "typeText"
      case .replaceText:
        return "replaceText"
      case .clearText:
        return "clearText"
      case .selectAllText:
        return "selectAllText"
      case .getText:
        return "getText"
      case .scrollToView:
        return "scrollToView"
      case .focus:
        return "focus"
      case .moveCursorToEnd:
        return "moveCursorToEnd"
      case .runScript:
        return "runScript"
      case .runScriptWithArgs:
        return "runScriptWithArgs"
      case .getCurrentUrl:
        return "getCurrentUrl"
      case .getTitle:
        return "getTitle"
    }
  }
}
