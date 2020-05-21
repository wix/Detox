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
	
	@discardableResult
	@objc(invokeWithDictionaryRepresentation:error:)
	public class func invoke(dictionaryRepresentation: [String: Any]) throws -> [String: Any] {
		let type = dictionaryRepresentation[Keys.type] as! String
		
		var rv : [String: Any]? = nil
		try dtx_try {
			switch type {
			case Types.action:
				let action = Action.with(dictionaryRepresentation: dictionaryRepresentation)
				rv = action.perform()
			case Types.expectation:
				let expectation = Expectation.with(dictionaryRepresentation: dictionaryRepresentation)
				expectation.evaluate()
			default:
				fatalError("Unknown invocation type \(type)")
			}
		}
		
		return rv ?? [:]
	}
	
	@objc(invokeWithDictionaryRepresentation:completionHandler:)
	public class func invoke(dictionaryRepresentation: [String: Any], completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		let type = dictionaryRepresentation[Keys.type] as! String
		
		switch type {
		case Types.action:
			let action = Action.with(dictionaryRepresentation: dictionaryRepresentation)
			action.perform(completionHandler: completionHandler)
		case Types.expectation:
			let expectation = Expectation.with(dictionaryRepresentation: dictionaryRepresentation)
			expectation.evaluate { error in
				completionHandler(nil, error)
			}
		default:
			fatalError("Unknown invocation type \(type)")
		}
	}
}
