//
//  Predicate.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/20/20.
//

import Foundation
import UIKit
import Detox.Private

class Predicate : CustomStringConvertible, CustomDebugStringConvertible {
  struct Keys {
    static let kind = "type"
    static let value = "value"
    static let predicate = "predicate"
    static let modifiers = "modifiers"
    static let predicates = "predicates"
  }

  struct Kind {
    static let id = "id"
    static let label = "label"
    static let value = "value"
    static let text = "text"
    static let type = "type"
    static let traits = "traits"

    static let ancestor = "ancestor"
    static let descendant = "descendant"

    static let and = "and"
    static let or = "or"
  }

  let kind : String
  let modifiers : Set<String>
  var hidden = false

  fileprivate init(kind: String, modifiers: Set<String>) {
    self.kind = kind
    self.modifiers = modifiers
  }

  class func with(dictionaryRepresentation: [String: Any]) throws -> Predicate {
    let kind = dictionaryRepresentation[Keys.kind] as! String //crash on failure
    let modifiers : Set<String>
    if let modifiersInput = dictionaryRepresentation[Keys.modifiers] as? [String] {
      modifiers = Set<String>(modifiersInput)
    } else {
      modifiers = []
    }

    switch kind {
      case Kind.traits:
        let value = dictionaryRepresentation[Keys.value] as! [String]
        return try TraitPredicate(kind: kind, modifiers: modifiers, stringTraits: value)
      case Kind.type:
        let className = dictionaryRepresentation[Keys.value] as! String
        return try KindOfPredicate(kind: kind, modifiers: modifiers, className: className)
      case Kind.label:
        let label = dictionaryRepresentation[Keys.value] as! String
        if ReactNativeSupport.isReactNativeApp == false {
          return ValuePredicate(kind: kind, modifiers: modifiers, value: label, requiresAccessibilityElement: true)
        } else {
          //Will crash if RN app and neither class exists
          let RCTTextViewClass : AnyClass = NSClassFromString("RCTText") ?? NSClassFromString("RCTTextView")!

          let descendantPredicate = DescendantPredicate(predicate: AndCompoundPredicate(predicates: [
            try KindOfPredicate(kind: Kind.type, modifiers: [], className: NSStringFromClass(RCTTextViewClass)),
            ValuePredicate(kind: kind, modifiers: modifiers, value: label, requiresAccessibilityElement: true)
          ], modifiers: []), modifiers: [Modifier.not])
          descendantPredicate.hidden = true

          return AndCompoundPredicate(predicates: [
            ValuePredicate(kind: kind, modifiers: modifiers, value: label, requiresAccessibilityElement: true),
            descendantPredicate
          ], modifiers: [])
        }
      case Kind.text:
        let text = dictionaryRepresentation[Keys.value] as! String

        var orPredicates = [
          try KindOfPredicate(kind: Kind.type, modifiers: [], className: NSStringFromClass(UITextView.self)),
          try KindOfPredicate(kind: Kind.type, modifiers: [], className: NSStringFromClass(UITextField.self)),
          try KindOfPredicate(kind: Kind.type, modifiers: [], className: NSStringFromClass(UILabel.self)),
        ]

        if ReactNativeSupport.isReactNativeApp == true {
          //Will crash if RN app and neither class exists
          let RCTTextViewClass : AnyClass = NSClassFromString("RCTText") ?? NSClassFromString("RCTTextView")!
          orPredicates.append(try KindOfPredicate(kind: Kind.type, modifiers: [], className: NSStringFromClass(RCTTextViewClass)))
        }

        let orCompoundPredicate = OrCompoundPredicate(predicates: orPredicates, modifiers: [])
        orCompoundPredicate.hidden = true

        return AndCompoundPredicate(predicates: [
          ValuePredicate(kind: kind, modifiers: modifiers, value: text, requiresAccessibilityElement: false),
          orCompoundPredicate
        ], modifiers: [])
      case Kind.id:
        let value = dictionaryRepresentation[Keys.value] as! CustomStringConvertible
        return ValuePredicate(kind: kind, modifiers: modifiers, value: value, requiresAccessibilityElement: false)
      case Kind.value:
        let value = dictionaryRepresentation[Keys.value] as! CustomStringConvertible
        return ValuePredicate(kind: kind, modifiers: modifiers, value: value, requiresAccessibilityElement: true)
      case Kind.ancestor:
        let predicate = try Predicate.with(dictionaryRepresentation: dictionaryRepresentation[Keys.predicate] as! [String: Any])
        return AncestorPredicate(predicate: predicate, modifiers: modifiers)
      case Kind.descendant:
        let predicate = try Predicate.with(dictionaryRepresentation: dictionaryRepresentation[Keys.predicate] as! [String: Any])
        return DescendantPredicate(predicate: predicate, modifiers: modifiers)
      case Kind.and:
        let predicatesDictionaryRepresentation = dictionaryRepresentation[Keys.predicates] as! [[String: Any]]
        let innerPredicates = try predicatesDictionaryRepresentation.compactMap { try Predicate.with(dictionaryRepresentation: $0) }

        let compoundPredicate : Predicate
        if innerPredicates.count == 1 {
          compoundPredicate = innerPredicates.first!
        } else {
          compoundPredicate = AndCompoundPredicate(predicates: innerPredicates, modifiers: modifiers)
        }
        return compoundPredicate
      default:
        fatalError("Unknown predicate type \(kind)")
    }
  }

  fileprivate func innerPredicateForQuery() -> NSPredicate {
    fatalError("Unimplemented innerPredicateForQuery() called for \(type(of: self))")
  }

  func predicateForQuery() -> NSPredicate {
    var rv = innerPredicateForQuery()

    if modifiers.contains(Modifier.not) {
      rv = NSCompoundPredicate(notPredicateWithSubpredicate: rv)
    }

    return rv
  }

  fileprivate var operatorDescription: String {
    get {
      return ""
    }
  }

  fileprivate var innerDescription: String {
    get {
      fatalError("Unimplemented innerDescription.get() called for \(type(of: self))")
    }
  }

  var description: String {
    get {
      let containsNot = modifiers.contains(Modifier.not)
      let operatorDescription = self.operatorDescription
      return "\(containsNot ? "NOT " : "")\(operatorDescription)\(containsNot || operatorDescription.count > 0 ? "(" : "")\(innerDescription)\(containsNot || operatorDescription.count > 0 ? ")" : "")"
    }
  }

  var debugDescription: String {
    return description
  }
}

class KindOfPredicate : Predicate {
  let className : String
  let cls : AnyClass

  init(kind: String, modifiers: Set<String>, className: String) throws {
    self.className = className
    if let cls = NSClassFromString(className) {
      self.cls = cls
    } else {
      throw dtx_errorForFatalError("Unknown class “\(className)”")
    }

    super.init(kind: kind, modifiers: modifiers)
  }

  override func innerPredicateForQuery() -> NSPredicate {
    return NSPredicate.init(format: "SELF isKindOfClass: %@", argumentArray: [cls])
  }

  override var innerDescription: String {
    get {
      return "class ⊇ “\(className)”"
    }
  }
}

class ValuePredicate : Predicate {
  let value : CustomStringConvertible
  let requiresAccessibilityElement: Bool

  init(kind: String, modifiers: Set<String>, value: CustomStringConvertible, requiresAccessibilityElement: Bool) {
    self.value = value
    self.requiresAccessibilityElement = requiresAccessibilityElement

    super.init(kind: kind, modifiers: modifiers)
  }

  override func innerPredicateForQuery() -> NSPredicate {
    return NSPredicate { evaluatedObject, _ in
      guard let evaluatedObject = evaluatedObject else {
        return false
      }

      let value = self.getValue(evaluatedObject, fromKind: self.kind)
      return value as? NSObject == self.value as? NSObject
    }
  }

  private func getValue(_ evaluatedObject: Any, fromKind kind: String) -> Any? {
    guard let object = evaluatedObject as? NSObject else {
      return nil
    }

    switch kind {
      case Kind.id:
        return object.accessibilityIdentifier

      case Kind.label:
        return object.accessibilityLabel

      case Kind.text:
        return object.dtx_text

      case Kind.value:
        return object.accessibilityValue

      default:
        return nil
    }
  }

  override var innerDescription: String {
    return "\(kind) == “\(value)”"
  }
}

fileprivate func traitStringsToTrait(_ traitStrings: [String]) throws -> UIAccessibilityTraits {
  var rv : UIAccessibilityTraits = []

  for traitString in traitStrings {
    switch traitString {
      case "none":
        break
      case "button":
        rv.insert(.button)
        break
      case "link":
        rv.insert(.link)
        break
      case "searchField":
        rv.insert(.searchField)
        break
      case "image":
        rv.insert(.image)
        break
      case "selected":
        rv.insert(.selected)
        break
      case "playsSound":
        rv.insert(.playsSound)
        break
      case "keyboardKey":
        rv.insert(.keyboardKey)
        break
      case "staticText":
        rv.insert(.staticText)
        break
      case "summaryElement":
        rv.insert(.summaryElement)
        break
      case "notEnabled":
        rv.insert(.notEnabled)
        break
      case "updatesFrequently":
        rv.insert(.updatesFrequently)
        break
      case "startsMediaSession":
        rv.insert(.startsMediaSession)
        break
      case "adjustable":
        rv.insert(.adjustable)
        break
      case "allowsDirectInteraction":
        rv.insert(.allowsDirectInteraction)
        break
      case "causesPageTurn":
        rv.insert(.causesPageTurn)
        break
      case "tabBar":
        rv.insert(.tabBar)
        break
      default:
        throw dtx_errorForFatalError("Unknown or unsupported accessibility trait “\(traitString)”")
    }
  }

  return rv
}

class TraitPredicate : Predicate {
  let stringTraits : [String]
  let traits : UIAccessibilityTraits

  init(kind: String, modifiers: Set<String>, stringTraits: [String]) throws {
    self.stringTraits = stringTraits
    self.traits = try traitStringsToTrait(stringTraits)

    super.init(kind: kind, modifiers: modifiers)
  }

  override func innerPredicateForQuery() -> NSPredicate {
    return NSPredicate.init { viewOrElse, _ -> Bool in
      let view = viewOrElse as! NSObject
      return view.isAccessibilityElement == true && (view.accessibilityTraits.rawValue & self.traits.rawValue) == self.traits.rawValue
    }
  }

  override var innerDescription: String {
    get {
      return "traits ⊇ “[\(stringTraits.joined(separator: ", "))]”"
    }
  }
}

class CompoundPredicate : Predicate{
  let predicates: [Predicate]

  init(predicates: [Predicate], modifiers: Set<String>) {
    self.predicates = predicates

    super.init(kind: Kind.and, modifiers: modifiers)
  }

  fileprivate func innerDescription(separator: String) -> String {
    return predicates.filter { $0.hidden == false }.map {
      let isMultiple = (type(of: $0) as AnyClass).isSubclass(of: CompoundPredicate.self)
      return isMultiple ? "(\($0))" : $0.description
    }.joined(separator: separator)
  }
}

class AndCompoundPredicate : CompoundPredicate {
  override func innerPredicateForQuery() -> NSPredicate {
    return NSCompoundPredicate(andPredicateWithSubpredicates: predicates.map { $0.predicateForQuery() } )
  }

  override var innerDescription: String {
    get {
      return innerDescription(separator: " && ")
    }
  }
}

class OrCompoundPredicate : CompoundPredicate {
  override func innerPredicateForQuery() -> NSPredicate {
    return NSCompoundPredicate(orPredicateWithSubpredicates: predicates.map { $0.predicateForQuery() } )
  }

  override var innerDescription: String {
    get {
      return innerDescription(separator: " || ")
    }
  }
}

class DescendantPredicate : Predicate {
  let predicate : Predicate

  init(predicate: Predicate, modifiers: Set<String>) {
    self.predicate = predicate

    super.init(kind: Kind.descendant, modifiers: modifiers)
  }

  override func innerPredicateForQuery() -> NSPredicate {
    return NSPredicate { evaluatedObject, bindings -> Bool in
      let view = evaluatedObject as! NSObject

      return UIView.dtx_findViews(inHierarchy: view, includingRoot: false, passing: self.predicate.predicateForQuery()).count > 0
    }
  }

  override var operatorDescription: String {
    get {
      return "DESCENDANT"
    }
  }

  override var innerDescription: String {
    get {
      return predicate.description
    }
  }
}

class AncestorPredicate : Predicate {
  let predicate : Predicate

  init(predicate: Predicate, modifiers: Set<String>) {
    self.predicate = predicate

    super.init(kind: Kind.ancestor, modifiers: modifiers)
  }

  override func innerPredicateForQuery() -> NSPredicate {
    return NSPredicate { evaluatedObject, bindings -> Bool in
      let predicate = self.predicate.predicateForQuery()

      var parent : NSObject? = evaluatedObject as! NSObject?
      while parent != nil {
        if let viewParent = parent as? UIView {
          parent = viewParent.superview
        } else {
          parent = parent!.accessibilityContainer as? NSObject
        }
        if parent != nil && predicate.evaluate(with: parent) == true {
          return true
        }
      }

      return false
    }
  }

  override var operatorDescription: String {
    get {
      return "ANCESTOR"
    }
  }

  override var innerDescription: String {
    get {
      return predicate.description
    }
  }
}
