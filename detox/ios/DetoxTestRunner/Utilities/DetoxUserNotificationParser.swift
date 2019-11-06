//
//  DetoxUserNotificationParser.swift
//  DetoxTestRunner
//
//  Created by Leo Natan (Wix) on 10/15/19.
//

import UIKit

public class DetoxUserNotificationParser: NSObject {
	@objc(parseUserNotificationWithDictionary:)
	public class func parseUserNotification(dict: [String: Any]?) -> [String: Any]? {
		guard let dict = dict else {
			return nil
		}
		
		guard let trigger = dict[DetoxUserNotificationKeys.trigger] as? [String: AnyObject],
			let triggerType = trigger[DetoxUserNotificationKeys.type] as? String,
			supportedTriggerTypes.contains(triggerType) else {
			Swift.fatalError("Missing trigger or invalid trigger type. A 'trigger' key must exist, with one of the following types: '\(supportedTriggerTypes.joined(separator: "', '"))'")
		}
		
		var rv = dict
		
		rv[DetoxUserNotificationKeys.absoluteTriggerType] = triggerType
		
		return rv
	}
}
