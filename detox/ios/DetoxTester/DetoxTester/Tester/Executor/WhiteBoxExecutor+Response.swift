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

    ///
    case identifiersAndFrames(_ value: [ElementIdentifierAndFrame])

    /// A response of operation completion.
    case completed

    /// A response of operation completion with an error.
    case completedWithError(message: String)

    /// A response of application current status.
    case status(_ value: EquatableDictionary)

    /// A response of failed operation.
    case failed(reason: String)

    /// A response of elements attributes.
    case elementsAttributes(_ value: [EquatableDictionary])
  }

  ///
  struct EquatableDictionary: Equatable {
    static func == (
      lhs: WhiteBoxExecutor.EquatableDictionary,
      rhs: WhiteBoxExecutor.EquatableDictionary
    ) -> Bool {
      // This is a compromise, instead of comparing all values.
      return lhs.value.keys == rhs.value.keys
    }

    let value: [String: Any]
  }
}

///
struct ElementIdentifierAndFrame: Codable, Equatable {
  ///
  let identifier: String?

  /// String representation of the frame.
  let frame: String?
}

extension WhiteBoxExecutor.Response {
  /// Asserts that the response equals the given expected response.
  func assertResponse(
    equalsTo expected: WhiteBoxExecutor.Response,
    for message: WhiteBoxExecutor.Message
  ) throws {
    if self != expected {
      whiteExecLog(
        "response `\(self)` expected to be `\(expected)`, for message: \(message)", type: .error)

      throw Error.unexpectedResult(actual: self, expected: expected, message: message)
    }
  }
}

extension WhiteBoxExecutor.Response {
  /// Represents an error related to `WhiteBoxExecutor.Response`.
  public enum Error: Swift.Error {
    /// Result does not equal to expected value.
    case unexpectedResult(
      actual: WhiteBoxExecutor.Response,
      expected: WhiteBoxExecutor.Response,
      message: WhiteBoxExecutor.Message
    )
  }
}

/// Extends `WhiteBoxExecutor.Response.Error` with error description.
extension WhiteBoxExecutor.Response.Error: CustomStringConvertible {
  public var description: String {
    switch self {
      case .unexpectedResult(let actual, let expected, let message):
        return "Received unexpected result from the white-box executor: \(actual), " +
            "expected: \(expected), for request: \(message)"
    }
  }
}
