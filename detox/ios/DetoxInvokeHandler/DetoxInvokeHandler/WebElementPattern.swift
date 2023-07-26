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
        self = .id(predicate.value)

      case .className:
        self = .className(predicate.value)

      case .cssSelector:
        self = .cssSelector(predicate.value)

      case .name:
        self = .name(predicate.value)

      case .xpath:
        self = .xpath(predicate.value)

      case .href:
        self = .href(predicate.value)

      case .hrefContains:
        self = .hrefContains(predicate.value)

      case .tag:
        self = .tag(predicate.value)
    }
  }
}
