//
//  WebPredicateType.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2023.
//

import Foundation

/// Represents a web predicate type.
public enum WebPredicateType: String, Codable, Hashable {
  /// ID predicate, expects the element's identifier to equal the specified `value`.
  case id = "id"

  /// Class-name predicate, expects the element's class name to equal the specified `value`.
  case className = "class"

  /// CSS selector predicate, expects the element's CSS selector to equal the specified `value`.
  case cssSelector = "css"

  /// Name predicate, expects the element's name to equal the specified `value`.
  case name = "name"

  /// xpath predicate, expects the element's xpath to equal the specified `value`.
  case xpath = "xpath"

  /// href predicate, expects the element's href to equal the specified `value`.
  case href = "href"

  /// href contains predicate, expects the element's href to contain the specified `value`.
  case hrefContains = "hrefContains"

  /// Tag predicate, expects the element's tag to equal the specified `value`.
  case tag = "tag"

  /// Label predicate, expects the element's label to equal the specified `value`.
  case label = "label"

  /// Value predicate, expects the element's value to equal the specified `value`.
  case value = "value"
}
