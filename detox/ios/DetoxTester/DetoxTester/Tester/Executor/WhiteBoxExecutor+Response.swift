//
//  WhiteBoxExecutor+Response.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation
import DetoxInvokeHandler

extension WhiteBoxExecutor {
  /// A response from a white-box executor.
  enum Response: Equatable {
    /// A boolean response.
    case boolean(_ value: Bool)

    /// A string response.
    case string(_ value: String)

    /// An array of strings response.
    case strings(_ value: [String])

    /// A response of operation completion.
    case completed

    /// A response of operation completion with an error.
    case completedWithError(message: String)

    /// A response of application current status.
    case status(_ value: [String: AnyHashable])

    /// A response of failed operation.
    case failed(reason: String)

    /// A response of elements attributes.
    case elementsAttributes(_ value: [[String: AnyHashable]])
  }
}


extension WhiteBoxExecutor.Response {
  /// Asserts that the response equals the given expected response.
  func assertResponse(equalsTo expected: WhiteBoxExecutor.Response) {
    if self != expected {
      whiteExecLog("reponse `\(self)` expected to be `\(expected)`", type: .error)
      fatalError("reponse `\(self)` expected to be `\(expected)`")
    }
  }
}
