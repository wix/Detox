//
//  WhiteBoxExecutor+Response.swift (DetoxTesterApp)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import Foundation

extension WhiteBoxExecutor {
  ///
  enum Response: Equatable {
    ///
    case none

    ///
    case failed(reason: String)
  }
}


extension WhiteBoxExecutor.Response {
  ///
  func assertResponse(equalsTo expected: WhiteBoxExecutor.Response) {
    if self != expected {
      execLog("reponse `\(self)` expected to be `\(expected)`", type: .error)
      fatalError("reponse `\(self)` expected to be `\(expected)`")
    }
  }
}
