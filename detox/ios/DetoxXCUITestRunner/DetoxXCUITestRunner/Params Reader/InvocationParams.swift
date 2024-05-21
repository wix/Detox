//
//  InvocationParams.swift (DetoxXCUITestRunner)
//  Created by Asaf Korem (Wix.com) on 2024.
//

import Foundation

struct InvocationParams: Codable {
  let type: InvocationType
  let predicate: Predicate
  let atIndex: Int?
  let action: Action?
  let expectation: Expectation?
  let expectationModifiers: [Expectation.Modifiers]?
  let params: [String: String]?

  enum CodingKeys: String, CodingKey {
    case type = "type"
    case predicate = "systemPredicate"
    case atIndex = "systemAtIndex"
    case action = "systemAction"
    case expectation = "systemExpectation"
    case expectationModifiers = "systemModifiers"
    case params = "params"
  }
}

extension InvocationParams {
  enum InvocationType: String, Codable {
    case action = "systemAction"
    case expectation = "systemExpectation"
  }
}

extension InvocationParams {
  struct Predicate: Codable, CustomStringConvertible {
    let type: Predicate.PredicateType
    let value: String

    var description: String {
      return "\(type.rawValue) == \"\(value)\""
    }
  }
}

extension InvocationParams.Predicate {
  enum PredicateType: String, Codable {
    case label
    case type
  }
}

extension InvocationParams {
  enum Action: String, Codable {
    case tap
  }
}

extension InvocationParams {
  enum Expectation: String, Codable {
    case exists = "toExist"
  }
}

extension InvocationParams.Expectation {
  enum Modifiers: String, Codable {
    case not
  }
}
