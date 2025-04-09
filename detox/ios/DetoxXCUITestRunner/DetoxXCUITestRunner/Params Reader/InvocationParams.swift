import Foundation

struct InvocationParams: Codable {
  let type: InvocationType
  let predicate: Predicate?
  let atIndex: Int?
  let action: Action?
  let expectation: Expectation?
  let expectationModifiers: [Expectation.Modifiers]?
  let params: [String]?

  enum CodingKeys: String, CodingKey {
    case type = "type"
    case systemPredicate = "systemPredicate"
    case webPredicate = "webPredicate"
    case systemAtIndex = "systemAtIndex"
    case webAtIndex = "webAtIndex"
    case systemAction = "systemAction"
    case webAction = "webAction"
    case systemExpectation = "systemExpectation"
    case webExpectation = "webExpectation"
    case systemModifiers = "systemModifiers"
    case webModifiers = "webModifiers"
    case params = "params"
  }

  init(from decoder: Decoder) throws {
    let container = try decoder.container(keyedBy: CodingKeys.self)
    type = try container.decode(InvocationType.self, forKey: .type)

    // Handle both systemPredicate and webPredicate for the predicate property
    if let systemPredicate = try? container.decode(Predicate.self, forKey: .systemPredicate) {
      predicate = systemPredicate
    } else if let webPredicate = try? container.decode(Predicate.self, forKey: .webPredicate) {
      predicate = webPredicate
    } else {
      predicate = nil
    }

    // Handle both systemAtIndex and webAtIndex for the atIndex property
    if let systemAtIndex = try? container.decode(Int.self, forKey: .systemAtIndex) {
      atIndex = systemAtIndex
    } else if let webAtIndex = try? container.decode(Int.self, forKey: .webAtIndex) {
      atIndex = webAtIndex
    } else {
      atIndex = nil
    }

    // Handle both systemAction and webAction for the action property
    if let systemAction = try? container.decode(Action.self, forKey: .systemAction) {
      action = systemAction
    } else if let webAction = try? container.decode(Action.self, forKey: .webAction) {
      action = webAction
    } else {
      action = nil
    }

    // Handle both systemExpectation and webExpectation for the expectation property
    if let systemExpectation = try? container.decode(Expectation.self, forKey: .systemExpectation) {
      expectation = systemExpectation
    } else if let webExpectation = try? container.decode(Expectation.self, forKey: .webExpectation) {
      expectation = webExpectation
    } else {
      expectation = nil
    }

    // Handle both systemModifiers and webModifiers for the expectationModifiers property
    if let systemModifiers = try? container.decode([Expectation.Modifiers].self, forKey: .systemModifiers) {
      expectationModifiers = systemModifiers
    } else if let webModifiers = try? container.decode([Expectation.Modifiers].self, forKey: .webModifiers) {
      expectationModifiers = webModifiers
    } else {
      expectationModifiers = nil
    }

    params = try container.decodeIfPresent([String].self, forKey: .params)
  }

  func encode(to encoder: Encoder) throws {
    var container = encoder.container(keyedBy: CodingKeys.self)
    try container.encode(type, forKey: .type)

    // Encode predicate to the appropriate key based on the type
    if type == .systemAction || type == .systemExpectation {
      try container.encode(predicate, forKey: .systemPredicate)
    } else if type == .webAction || type == .webExpectation {
      try container.encode(predicate, forKey: .webPredicate)
    }

    // Encode atIndex to the appropriate key based on the type
    if let atIndex = atIndex {
      if type == .systemAction || type == .systemExpectation {
        try container.encode(atIndex, forKey: .systemAtIndex)
      } else if type == .webAction || type == .webExpectation {
        try container.encode(atIndex, forKey: .webAtIndex)
      }
    }

    // Encode action to the appropriate key based on the type
    if let action = action {
      if type == .systemAction {
        try container.encode(action, forKey: .systemAction)
      } else if type == .webAction {
        try container.encode(action, forKey: .webAction)
      }
    }

    // Encode expectation to the appropriate key based on the type
    if let expectation = expectation {
      if type == .systemExpectation {
        try container.encode(expectation, forKey: .systemExpectation)
      } else if type == .webExpectation {
        try container.encode(expectation, forKey: .webExpectation)
      }
    }

    // Encode expectationModifiers to the appropriate key based on the type
    if let expectationModifiers = expectationModifiers {
      if type == .systemExpectation {
        try container.encode(expectationModifiers, forKey: .systemModifiers)
      } else if type == .webExpectation {
        try container.encode(expectationModifiers, forKey: .webModifiers)
      }
    }

    try container.encodeIfPresent(params, forKey: .params)
  }
}

extension InvocationParams {
  enum InvocationType: String, Codable {
    case systemAction = "systemAction"
    case systemExpectation = "systemExpectation"
    case webAction = "webAction"
    case webExpectation = "webExpectation"
  }
}

extension InvocationParams {
  struct Predicate: Codable, CustomStringConvertible {
    let type: PredicateType
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
    case coordinateTap
    case coordinateLongPress
    case typeText
    case replaceText
    case clearText
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

extension InvocationParams {
  enum Error: Swift.Error, LocalizedError {
    case dataCorruptedError(String)

    var errorDescription: String? {
      switch self {
        case .dataCorruptedError(let kind):
          return "Invocation params missing \(kind) param"
      }
    }
  }
}
