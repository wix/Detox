//
//  InvocationParamsReader.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

class InvocationParamsReader {
  static func readParams() throws -> InvocationParams {
    do {
      guard let base64Params = Environment.params else {
        throw Error.missingRunnerParams
      }

      guard let data = Data(base64Encoded: base64Params) else {
        throw Error.failedToDecodeParams(base64Params)
      }

      return try JSONDecoder().decode(InvocationParams.self, from: data)
    }
  }
}

extension InvocationParamsReader {
  enum Error: Swift.Error, LocalizedError {
    case missingRunnerParams
    case failedToDecodeParams(_ base64Params: String)

    var errorDescription: String? {
      switch self {
        case .missingRunnerParams:
          return "Missing runner params (`TEST_RUNNER_PARAMS`) in environment variables"

        case .failedToDecodeParams(let base64Params):
          return "Failed to decode runner params from base64 string: \(base64Params)"
      }
    }
  }
}
