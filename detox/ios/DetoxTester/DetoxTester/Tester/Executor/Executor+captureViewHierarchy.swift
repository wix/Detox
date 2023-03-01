//
//  Executor+captureViewHierarchy.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension Executor {
  func captureViewHierarchy(params: [String: AnyHashable], messageId: NSNumber) {
    if !isWhiteBoxExecutorAvailable() {
      execLog("capture view hierarchy failed, target app is not white-box handled", type: .error)
      return
    }

    let url = params.viewHierarchyURL
    precondition(
      url.hasSuffix(".viewhierarchy"),
      "provided view hierarchy URL is not in the expected format, must end with `.viewhierarchy`"
    )

    let result = execute(whiteBoxRequest: .captureViewHierarchy(viewHierarchyURL: url))
    switch result {
      case .string(let path):
        execLog("saved view hierarchy artifact on path: \(path)")
        sendAction(.reportCaptureViewHierarchyDone, params: [:], messageId: messageId)

      case .completedWithError(message: let message):
        sendAction(
          .reportCaptureViewHierarchyDone,
          params: [
            "captureViewHierarchyError" : message
          ],
          messageId: messageId
        )

      default:
        fatalError("Should never get here")
    }
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var viewHierarchyURL: String {
    return self["viewHierarchyURL"] as! String
  }
}
