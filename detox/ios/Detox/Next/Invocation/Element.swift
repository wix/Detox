//
//  Element.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/27/20.
//

import Foundation
import UIKit

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
	
	var exists : Bool {
		get {
			let array = UIView.dtx_findViewsInKeySceneWindows(passing: predicate.predicateForQuery())
			return array.count > 0
		}
	}

	var view : UIView {
		get {
			let array = UIView.dtx_findViewsInKeySceneWindows(passing: predicate.predicateForQuery()) as! [UIView]
			
			let element : UIView
			if let index = index {
				element = array[index]
			} else {
				//Will fail test if more than one element are resolved from the query
				guard array.count == 1 else {
					if array.count == 0 {
						dtx_fatalError("No elements found for “\(self.description)”")
					} else {
						dtx_fatalError("Multiple elements found for “\(self.description)”")
					}
				}
				element = array.first!
			}
			
			return element
		}
	}
	
	var description: String {
		get {
			return String(format: "PREDICATE(%@)%@", predicate.description, index != nil ? " AT INDEX(\(index!))" : "")
		}
	}
}
