//
//  Element.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation

class Element : CustomStringConvertible {
	let predicate : Predicate
	let index : Int?
	
	struct Keys {
		static let predicate = "predicate"
		static let index = "index"
	}
	
	required init(predicate: Predicate, index: Int?) {
		self.predicate = predicate
		self.index = index
	}
	
	class func with(dictionaryRepresentation: [String: Any]) -> Element {
		let predicateDictionaryRepresentation = dictionaryRepresentation[Keys.predicate] as! [String: Any]
		let index = dictionaryRepresentation[Keys.index] as! Int?
		
		return Element(predicate: Predicate.with(dictionaryRepresentation: predicateDictionaryRepresentation), index: index)
	}
	
	func matchingElement(forQuery query: XCUIElementQuery) -> XCUIElement {
		let query = predicate.applyTo(elementQuery: query)
		
		let element : XCUIElement
		if let index = index {
			element = query.element(boundBy: index)
		} else {
			//Will fail test if more than one element are resolved from the query
			element = query.element
		}
		
		return element
	}
	
	var description: String {
		get {
			return String(format: "PREDICATE(%@)%@", predicate.description, index != nil ? " AT INDEX(\(index!))" : "")
		}
	}
}
