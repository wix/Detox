//
//  MessageBuilder+action.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Builders for web-actions.
extension MessageBuilder {
  func makeWebTapAction() -> Self {
    return setWebAction("tap")
  }

  func makeWebTypeTextAction(_ text: String) -> Self {
    message["params"] = [text]
    return setWebAction("typeText")
  }

  func makeWebReplaceTextAction(_ text: String) -> Self {
    message["params"] = [text]
    return setWebAction("replaceText")
  }

  func makeWebClearTextAction() -> Self {
    return setWebAction("clearText")
  }

  func makeWebSelectAllTextAction() -> Self {
    return setWebAction("selectAllText")
  }

  func makeWebGetTextAction() -> Self {
    return setWebAction("getText")
  }

  func makeWebScrollToViewAction() -> Self {
    return setWebAction("scrollToView")
  }

  func makeWebFocusAction() -> Self {
    return setWebAction("focus")
  }

  func makeWebMoveCursorToEndAction() -> Self {
    return setWebAction("moveCursorToEnd")
  }

  func makeWebRunScriptAction(_ script: String) -> Self {
    message["params"] = [script]
    return setWebAction("runScript")
  }

  func makeWebRunScriptWithArgsAction(_ script: String, args: [String]) -> Self {
    let params: [AnyHashable] = [script, args]
    message["params"] = params

    return setWebAction("runScriptWithArgs")
  }

  func makeWebGetCurrentUrlAction() -> Self {
    return setWebAction("getCurrentUrl")
  }

  func makeWebGetTitleAction() -> Self {
    return setWebAction("getTitle")
  }

  fileprivate func setWebAction(_ action: String) -> Self {
    message.merge([
      "type": "webAction",
      "webAction": action
    ]) {(_,new) in new}

    return self
  }
}
