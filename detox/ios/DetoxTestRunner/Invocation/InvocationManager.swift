//
//  InvocationManager.swift
//  DetoxTestRunner
//
//  Created by Alon Haiut on 10/10/2021.
//  Copyright © 2021 Wix. All rights reserved.
//

import UIKit
import XCTest

@objc(DTXInvocationManager) public class InvocationManager: NSObject {
	private let application : DTXDetoxApplication
	
	internal struct Keys {
		static let type = "type"
	}
	
	internal struct Types {
		static let action = "action"
		static let expectation = "expectation"
	}
	
	@objc(initWithApplication:)
	public init(application: DTXDetoxApplication) {
		self.application = application
	}
	
	@objc(invokeWithDictionaryRepresentation:)
	public func invoke(dictionaryRepresentation: [String: Any]) -> [String: Any]? {
		let type = dictionaryRepresentation[Keys.type] as! String
		
		switch type {
		case Types.action:
			let action = Action.with(dictionaryRepresentation: dictionaryRepresentation)
			return action.perform(on: application)
		case Types.expectation:
			let expectation = Expectation.with(dictionaryRepresentation: dictionaryRepresentation)
			return ["expectationResult": expectation.evaluate(with: application)]
		default:
			fatalError("Unknown invocation type \(type)")
		}
	}
}
