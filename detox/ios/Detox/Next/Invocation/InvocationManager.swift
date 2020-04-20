//
//  InvocationManager.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/20/20.
//

import UIKit

@objc(DTXInvocationManager) public class InvocationManager: NSObject {
	internal struct Keys {
		static let type = "type"
	}
	
	internal struct Types {
		static let action = "action"
		static let expectation = "expectation"
	}
	
	@objc(invokeWithDictionaryRepresentation:)
	public func invoke(dictionaryRepresentation: [String: Any]) -> [String: Any]? {
		let type = dictionaryRepresentation[Keys.type] as! String
		
		switch type {
		case Types.action:
			let action = Action.with(dictionaryRepresentation: dictionaryRepresentation)
			return action.perform()
		case Types.expectation:
			let expectation = Expectation.with(dictionaryRepresentation: dictionaryRepresentation)
			return ["expectationResult": expectation.evaluate()]
		default:
			fatalError("Unknown invocation type \(type)")
		}
	}
}
