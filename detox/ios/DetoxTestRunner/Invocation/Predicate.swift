//
//  Predicate.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/20/20.
//

import Foundation

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
			return DescendantPredicate(predicate: predicate, matching: false, modifiers: modifiers)
		case Kind.and:
			let predicatesDictionaryRepresentation = dictionaryRepresentation[Keys.predicates] as! [[String: Any]]
			var ancestorPredicate : AncestorPredicate? = nil
			var descendantPredicate : DescendantPredicate? = nil
			let innerPredicates = predicatesDictionaryRepresentation.compactMap { innerPredicateDictionaryRepresentation -> Predicate? in
				let rv = Predicate.with(dictionaryRepresentation: innerPredicateDictionaryRepresentation)
				
				if let rv = rv as? DescendantPredicate {
					precondition(descendantPredicate == nil, "Found multiple descendant predicates")
					descendantPredicate = rv
					return nil
				}
				
				if let rv = rv as? AncestorPredicate {
					precondition(ancestorPredicate == nil, "Found multiple ancestor predicates")
					ancestorPredicate = rv
					return nil
				}
				
				return rv
			}
			
			let compoundPredicate : Predicate
			if innerPredicates.count == 1 {
				compoundPredicate = innerPredicates.first!
			} else {
				compoundPredicate = AndCompoundPredicate(predicates: innerPredicates, descendantPredicate: descendantPredicate, modifiers: modifiers)
			}
			if let ancestorPredicate = ancestorPredicate {
				return AndCompoundPredicate(predicates: [ancestorPredicate.predicate], descendantPredicate: DescendantPredicate(predicate: compoundPredicate, matching: true, modifiers: []), modifiers: modifiers)
			}
			return compoundPredicate
		default:
			fatalError("Unknown predicate type \(kind)")
		}
	}
	
	fileprivate func innerPredicateForQuery() -> NSPredicate {
		fatalError("Unimplemented innerPredicateForQuery() called for \(type(of: self))")
	}
	
	fileprivate func predicateForQuery() -> NSPredicate {
		var rv = innerPredicateForQuery()
		
		if modifiers.contains(Modifier.not) {
			rv = NSCompoundPredicate(notPredicateWithSubpredicate: rv)
		}
		
		return rv
	}
	
	func applyTo(elementQuery: XCUIElementQuery) -> XCUIElementQuery {
		return elementQuery.matching(predicateForQuery())
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
		Kind.id: ("identifier", { return $0 }),
		Kind.label: ("label", { return $0 }),
		Kind.text: ("label", { return $0 }),
		Kind.type: ("elementType", { elementType in
			return NSNumber(value: elementTypeToXCUIElementType(elementType as! String).rawValue)
		}),
		Kind.value: ("value", { return $0 })
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
	let descendantPredicate : DescendantPredicate?
	
	init(predicates: [Predicate], descendantPredicate: DescendantPredicate?, modifiers: Set<String>) {
		self.predicates = predicates
		self.descendantPredicate = descendantPredicate
		
		super.init(kind: Kind.and, modifiers: modifiers)
	}
	
	override func innerPredicateForQuery() -> NSPredicate {
		return NSCompoundPredicate(andPredicateWithSubpredicates: predicates.map { $0.predicateForQuery() } )
	}
	
	override func applyTo(elementQuery: XCUIElementQuery) -> XCUIElementQuery {
		let rv = super.applyTo(elementQuery: elementQuery)
		
		if let descendantPredicate = descendantPredicate {
			return descendantPredicate.applyTo(elementQuery: rv)
		}
		
		return rv
	}
	
	override var description: String {
		get {
			return String(format: "(%@%@)", predicates.map{ $0.description }.joined(separator: " && "), descendantPredicate != nil ? " && \(descendantPredicate!.description)" : "")
		}
	}
}

class DescendantPredicate : Predicate {
	let predicate : Predicate
	let matching : Bool
	
	init(predicate: Predicate, matching: Bool, modifiers: Set<String>) {
		self.predicate = predicate
		self.matching = matching
		
		super.init(kind: Kind.descendant, modifiers: modifiers)
	}
	
	override func applyTo(elementQuery: XCUIElementQuery) -> XCUIElementQuery {
		if matching {
			return elementQuery.descendants(matching: .any).matching(predicate.predicateForQuery())
		} else {
			return elementQuery.containing(predicate.predicateForQuery())
		}
	}
	
	override var description: String {
		get {
			return String(format: "DESCENDANT%@(%@)", matching ? "_MATCHING" : "", predicate.description)
		}
	}
}

class AncestorPredicate : Predicate {
	let predicate : Predicate
	
	init(predicate: Predicate, modifiers: Set<String>) {
		self.predicate = predicate
		
		super.init(kind: Kind.ancestor, modifiers: modifiers)
	}
	
	override var description: String {
		get {
			return String(format: "ANCESTOR(%@)", predicate.description)
		}
	}
}
