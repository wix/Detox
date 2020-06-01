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
		static let index = "atIndex"
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
		do {
			var moreThanZero : Bool = false
			try dtx_try {
				moreThanZero = self.views.count > 0
			}
			return moreThanZero
		} catch {
			return false
		}
	}
	
	var views : [UIView] {
		let array = UIView.dtx_findViewsInKeySceneWindows(passing: predicate.predicateForQuery()) as! [UIView]
		
		guard array.count > 0 else {
			dtx_fatalError("No elements found for “\(self.description)”")
		}
		
		return array
	}
	
	var view : UIView {
		let array = self.views
		
		let element : UIView
		if let index = index {
			element = array[index]
		} else {
			//Will fail test if more than one element are resolved from the query
			guard array.count == 1 else {
				dtx_fatalError("Multiple elements found for “\(self.description)”")
			}
			element = array.first!
		}
		
		return element
	}
	
	var description: String {
		return String(format: "MATCHER(%@)%@", predicate.description, index != nil ? " AT INDEX(\(index!))" : "")
	}
}
