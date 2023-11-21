//
//  XCUIElement+runScript.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation
import XCTest

/// Extension for evaluating JavaScript code on web-view element.
extension XCUIElement {
  /// Evaluate script on this web-view element, hosted on `host` web-view.
  func runScript(
    withHost host: XCUIElement,
    script: String,
    args: [String],
    whiteBoxMessageHandler: @escaping WhiteBoxMessageHandler
  ) throws -> String {

    let label = self.value(forKey: "label") as? String

    guard let label = label else {
      matcherLog(
        "failed to execute given script, could not find element with label `\(String(describing: label))`",
        type: .error
      )

      throw Error.failedToEvaluateScript(element: self, host: host, script: script, args: args)
    }

    let jsArgs = args.count != 0 ? ", \(args.joined(separator: ", "))" : ""

    let response = whiteBoxMessageHandler(
      .evaluateJavaScript(webViewElement: host, script: """
        (() => {
          let element = document.querySelector('[aria-label="\(label)"]');

          if (!element) {
              return null;
          }

          return \(script)(element\(jsArgs));
        })();
      """)
    )

    guard case .string(let string) = response else {
      matcherLog(
        "failed to execute given script, response: \(response.debugDescription)",
        type: .error
      )

      throw Error.failedToEvaluateScript(element: self, host: host, script: script, args: args)
    }

    return string
  }
}

