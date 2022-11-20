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
      url.lastPathComponent.hasSuffix(".viewhierarchy"),
      "provided view hierarchy URL is not in the expected format, must end with `.viewhierarchy`"
    )

    let result = execute(whiteBoxRequest: .captureViewHierarchy(viewHierarchyURL: url))
    switch result {
      case .completed:
        sendAction(.reportCaptureViewHierarchyDone, params: [:], messageId: messageId)

      case .completedWithError(message: let message):
        sendAction(
          .reportCaptureViewHierarchyDone,
          params: [
            "captureViewHierarchyError" : message
          ],
          messageId: messageId
        )

      case .failed(reason: let reason):
        execLog("capture view hierarchy failed, reason: \(reason)", type: .error)
        fatalError("capture view hierarchy failed, reason: \(reason)")

      case .boolean, .string, .strings, .status, .elementsAttributes(_):
        fatalError("Should never get here")
    }
  }
}

private extension Dictionary where Key == String, Value == AnyHashable {
  var viewHierarchyURL: URL {
    let stringPath = self["viewHierarchyURL"] as! String
    return URL(fileURLWithPath: stringPath)
  }
}
