//
//  InvocationManager.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/20/20.
//

import UIKit

final class InvocationManager {
	internal struct Keys {
		static let type = "type"
	}
	
	internal struct Types {
		static let action = "action"
		static let expectation = "expectation"
	}
	
	class func invoke(dictionaryRepresentation: [String: Any], completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		do {
			try dtx_try {
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
		} catch {
			completionHandler(nil, error)
		}
	}
}
