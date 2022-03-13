//
//  ElementPattern.swift (DetoxInvokeHandler)
//  Created by Asaf Korem (Wix.com) on 2022.
//

import UIKit

/// Represents a pattern of element to match using the element matcher (`ElementMatcherProtocol`).
public indirect enum ElementPattern: Hashable, Equatable {
  /// Text pattern, find elements that have the specified text.
  case text(String)

  /// Label pattern, find elements that have the specified label.
  case label(String)

  /// Value pattern, find elements that have the specified value.
  case value(String)

  /// And composition pattern, find elements that matches all specified `patterns`.
  case and(patterns: [ElementPattern])

  /// ID pattern, find elements that have the specified ID.
  case id(String)

  /// Traits pattern, find elements that have the specified accessibility traits.
  case traits([AccessibilityTrait])

  /// Ancestor pattern, find elements that have the specified `pattern` on their ancestor.
  case ancestor(pattern: ElementPattern)

  /// Decendant pattern, find elements that have the specified `pattern` on one of their decendants.
  case decendant(pattern: ElementPattern)
}

extension ElementPattern {
  /// Error associated with element patterns.
  enum Error: Swift.Error {
    /// Invalid predicate.
    case invalidPredicate
  }
}

extension ElementPattern {
  /// Initializes the element pattern from a message `predicate`.
  init(from predicate: MessagePredicate) throws {
    switch predicate.type {
      case .text:
        self = .text(predicate.value?.value as! String)

      case .label:
        self = .label(predicate.value?.value as! String)

      case .value:
        self = .value(predicate.value?.value as! String)

      case .id:
        self = .id(predicate.value?.value as! String)

      case .traits:
        let rawTraits = predicate.value?.value as! [String]
        self = .traits(rawTraits.map{ AccessibilityTrait(rawValue: $0)! })

      case .and:
        self = .and(patterns: try predicate.predicates!.map{ try .init(from: $0) })

      case .ancestor:
        self = .ancestor(pattern: try .init(from: predicate.predicate!))

      case .decendant:
        self = .decendant(pattern: try .init(from: predicate.predicate!))
    }
  }

  /// Initializes the element pattern from a message `predicate`.
  init(from predicate: MessageSubPredicate) throws {
    switch predicate.type {
      case .text:
        self = .text(predicate.value?.value as! String)

      case .label:
        self = .label(predicate.value?.value as! String)

      case .value:
        self = .value(predicate.value?.value as! String)

      case .id:
        self = .id(predicate.value?.value as! String)

      case .traits:
        let rawTraits = predicate.value?.value as! [String]
        self = .traits(rawTraits.map{ AccessibilityTrait(rawValue: $0)! })

      case .and:
        self = .and(patterns: try predicate.predicates!.map{ try .init(from: $0) })

      case .ancestor:
        self = .ancestor(pattern: try .init(from: predicate.predicate!))

      case .decendant:
        self = .decendant(pattern: try .init(from: predicate.predicate!))
    }
  }

  /// Initializes the element pattern from a message `predicate`.
  init(from predicate: MessageSubSubPredicate) throws {
    switch predicate.type {
      case .text:
        self = .text(predicate.value?.value as! String)
        
      case .label:
        self = .label(predicate.value?.value as! String)

      case .value:
        self = .value(predicate.value?.value as! String)

      case .id:
        self = .id(predicate.value?.value as! String)

      case .traits:
        let rawTraits = predicate.value?.value as! [String]
        self = .traits(rawTraits.map{ AccessibilityTrait(rawValue: $0)! })

      case .and:
        self = .and(patterns: try predicate.predicates!.map{ try .init(from: $0) })

      case .ancestor:
        self = .ancestor(pattern: try .init(from: predicate.predicate!))

      case .decendant:
        self = .decendant(pattern: try .init(from: predicate.predicate!))
    }
  }

  /// Initializes the element pattern from a message `predicate`.
  init(from predicate: MessageSubSubSubPredicate) throws {
    switch predicate.type {
      case .text:
        self = .text(predicate.value?.value as! String)

      case .label:
        self = .label(predicate.value?.value as! String)

      case .id:
        self = .id(predicate.value?.value as! String)

      case .value:
        self = .value(predicate.value?.value as! String)

      case .traits:
        let rawTraits = predicate.value?.value as! [String]
        self = .traits(rawTraits.map{ AccessibilityTrait(rawValue: $0)! })

      default:
        throw Error.invalidPredicate
    }
  }
}
