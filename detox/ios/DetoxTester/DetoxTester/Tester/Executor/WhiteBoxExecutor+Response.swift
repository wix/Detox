//
//  WhiteBoxExecutor+Response.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension WhiteBoxExecutor {
  ///
  enum Response: Equatable {
    ///
    case boolean(_ value: Bool)

    ///
    case string(_ value: String)

    ///
    case completed

    ///
    case completedWithError(message: String)

    ///
    case failed(reason: String)
  }
}


extension WhiteBoxExecutor.Response {
  ///
  func assertResponse(equalsTo expected: WhiteBoxExecutor.Response) {
    if self != expected {
      whiteExecLog("reponse `\(self)` expected to be `\(expected)`", type: .error)
      fatalError("reponse `\(self)` expected to be `\(expected)`")
    }
  }
}
