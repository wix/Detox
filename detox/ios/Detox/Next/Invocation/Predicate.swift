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
		
		static let ancestor = "ancestor"
		static let descendant = "descendant"
		
		static let and = "and"
	}
	
	let kind : String
	let modifiers : Set<String>
	
	fileprivate init(kind: String, modifiers: Set<String>) {
		self.kind = kind
		self.modifiers = modifiers
	}
	
	class func with(dictionaryRepresentation: [String: Any]) -> Predicate {
		let kind = dictionaryRepresentation[Keys.kind] as! String //crash on failure
		let modifiers : Set<String>
		if let modifiersInput = dictionaryRepresentation[Keys.modifiers] as? [String] {
			modifiers = Set<String>(modifiersInput)
		} else {
			modifiers = []
		}
		
		switch kind {
		case Kind.id, Kind.label, Kind.text, Kind.type, Kind.value:
			let value = dictionaryRepresentation[Keys.value] as Any
			return ValuePredicate(kind: kind, modifiers: modifiers, value: value)
		case Kind.ancestor:
			let predicate = Predicate.with(dictionaryRepresentation: dictionaryRepresentation[Keys.predicate] as! [String: Any])
			return AncestorPredicate(predicate: predicate, modifiers: modifiers)
		case Kind.descendant:
			let predicate = Predicate.with(dictionaryRepresentation: dictionaryRepresentation[Keys.predicate] as! [String: Any])
			return DescendantPredicate(predicate: predicate, modifiers: modifiers)
		case Kind.and:
			let predicatesDictionaryRepresentation = dictionaryRepresentation[Keys.predicates] as! [[String: Any]]
			let innerPredicates = predicatesDictionaryRepresentation.compactMap { Predicate.with(dictionaryRepresentation: $0) }
			
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
	
	var description: String {
		fatalError("Unimplemented description.get() called for \(type(of: self))")
	}
	
	var debugDescription: String {
		return description
	}
}

class ValuePredicate : Predicate {
	let value : Any
	
	static let mapping : [String: (String, (Any) -> Any)] = [
		Kind.id: ("accessibilityIdentifier", { return $0 }),
		Kind.label: ("accessibilityLabel", { return $0 }),
		Kind.text: ("text", { return $0 }),
		Kind.type: ("className", { return $0 }),
		Kind.value: ("accessibilityValue", { return $0 })
	]
	
	init(kind: String, modifiers: Set<String>, value: Any) {
		self.value = value
		
		super.init(kind: kind, modifiers: modifiers)
	}
	
	override func innerPredicateForQuery() -> NSPredicate {
		let (keyPath, transformer) = ValuePredicate.mapping[kind]!
		
		return NSComparisonPredicate(leftExpression: NSExpression(forKeyPath: keyPath), rightExpression: NSExpression(forConstantValue: transformer(value)), modifier: .direct, type: .equalTo, options: [])
	}
	
	override var description: String {
		get {
			return self.predicateForQuery().description
		}
	}
}

class AndCompoundPredicate : Predicate {
	let predicates: [Predicate]
	
	init(predicates: [Predicate], modifiers: Set<String>) {
		self.predicates = predicates
		
		super.init(kind: Kind.and, modifiers: modifiers)
	}
	
	override func innerPredicateForQuery() -> NSPredicate {
		return NSCompoundPredicate(andPredicateWithSubpredicates: predicates.map { $0.predicateForQuery() } )
	}
	
	override var description: String {
		get {
			return String(format: "(%@)", predicates.map{ $0.description }.joined(separator: " && "))
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
			let view = evaluatedObject as! UIView
			
			UIView.dtx_findViews(inHierarchy: view, passing: self.predicate.predicateForQuery())
			
			return false
		}
	}
	
	override var description: String {
		get {
			return String(format: "DESCENDANT%@(%@)", predicate.description)
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
			let view = evaluatedObject as! UIView
			
			var parent : UIView? = view
			while parent != nil {
				parent = view.superview
				if parent != nil && self.predicate.predicateForQuery().evaluate(with: parent) == true {
					return true
				}
			}
			
			return false
		}
	}
	
	override var description: String {
		get {
			return String(format: "ANCESTOR(%@)", predicate.description)
		}
	}
}
