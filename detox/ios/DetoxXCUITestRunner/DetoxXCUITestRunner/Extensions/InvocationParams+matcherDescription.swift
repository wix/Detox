//
//  InvocationParams+matcherDescription.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

extension InvocationParams {
  var matcherDescription: String {
      return predicate?.description ?? "none"
  }
}
