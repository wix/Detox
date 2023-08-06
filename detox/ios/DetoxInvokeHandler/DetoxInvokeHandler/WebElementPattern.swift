//
//  WebElementPattern.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Represents a pattern of web element to match using the element matcher
/// (`ElementMatcherProtocol`).
public indirect enum WebElementPattern: Hashable, Equatable {
  /// ID predicate, expects the element's identifier to equal the specified value.
  case id(String)

  /// Class-name predicate, expects the element's class name to equal the specified value.
  case className(String)

  /// CSS selector predicate, expects the element's CSS selector to equal the specified value.
  case cssSelector(String)

  /// Name predicate, expects the element's name to equal the specified value.
  case name(String)

  /// xpath predicate, expects the element's xpath to equal the specified value.
  case xpath(String)

  /// href predicate, expects the element's href to equal the specified value.
  case href(String)

  /// href contains predicate, expects the element's href to contain the specified value.
  case hrefContains(String)

  /// Tag predicate, expects the element's tag to equal the specified value.
  case tag(String)

  /// Label predicate, expects the element's label to equal the specified value.
  case label(String)

  /// Value predicate, expects the element's value to equal the specified value.
  case value(String)
}

extension WebElementPattern {
  /// Error associated with web element patterns.
  enum Error: Swift.Error {
    /// Invalid predicate.
    case invalidPredicate
  }
}

extension WebElementPattern {
  /// Initializes the element pattern from a message `predicate`.
  init(from predicate: WebPredicate) throws {
    switch predicate.type {
      case .id:
        self = .id(predicate.value.value as! String)

      case .className:
        self = .className(predicate.value.value as! String)

      case .cssSelector:
        self = .cssSelector(predicate.value.value as! String)

      case .name:
        self = .name(predicate.value.value as! String)

      case .xpath:
        self = .xpath(predicate.value.value as! String)

      case .href:
        self = .href(predicate.value.value as! String)

      case .hrefContains:
        self = .hrefContains(predicate.value.value as! String)

      case .tag:
        self = .tag(predicate.value.value as! String)

      case .label:
        self = .label(predicate.value.value as! String)

      case .value:
        self = .value(predicate.value.value as! String)
    }
  }
}
