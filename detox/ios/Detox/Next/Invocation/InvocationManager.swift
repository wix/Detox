//
//  InvocationManager.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 2/20/20.
//

import UIKit
import os.signpost

fileprivate let log = DetoxLog(category: "InvocationManager")

final class InvocationManager {
	internal struct Keys {
		static let type = "type"
	}
	
	internal struct Types {
		static let action = "action"
		static let expectation = "expectation"
	}
	
	class func invoke(dictionaryRepresentation: [String: Any], completionHandler: @escaping ([String: Any]?, Error?) -> Void) {
		let signpostID = OSSignpostID(log: log.osLog)
		let signpostCompletionHandler : ([String: Any]?, Error?) -> Void = { result, error in
			os_signpost(.end, log: log.osLog, name: "Invocation", signpostID: signpostID, error != nil ? "error: %{public}s" : "", "\(error?.localizedDescription ?? "")")
			completionHandler(result, error)
		}
		
		do {
			let kind = dictionaryRepresentation[Keys.type] as! String
			
			switch kind {
			case Types.action:
				let action = try Action.with(dictionaryRepresentation: dictionaryRepresentation)
				os_signpost(.begin, log: log.osLog, name: "Invocation", signpostID: signpostID, "Action: %{public}s", "\(type(of: action))")
				action.perform(completionHandler: signpostCompletionHandler)
			case Types.expectation:
				let expectation = try Expectation.with(dictionaryRepresentation: dictionaryRepresentation)
				os_signpost(.begin, log: log.osLog, name: "Invocation", signpostID: signpostID, "Expectation: %{public}s", "\(type(of: expectation))")
				expectation.evaluate { error in
					signpostCompletionHandler(nil, error)
				}
			default:
				fatalError("Unknown invocation type “\(kind)”")
			}
		} catch {
			signpostCompletionHandler(nil, error)
		}
	}
}
